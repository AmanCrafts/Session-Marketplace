"""
Session views.

The public catalog and detail endpoints live at `/api/sessions` and
`/api/sessions/<id>`. Creator CRUD lives at `/api/creator/sessions`.
"""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from accounts.services import get_current_user
from common.permissions import IsCreator
from sessions.filters import SessionFilter
from sessions.permissions import (
    IsCreatorOrReadOnly,
    IsSessionOwner,
    PublishedSessionOnly,
)
from sessions.serializers import (
    SessionReadSerializer,
    SessionStatusUpdateSerializer,
    SessionWriteSerializer,
)
from sessions.services import (
    annotate_with_booking_counts,
    archive_session,
    create_session,
    delete_session,
    list_published_sessions,
    list_sessions_for_creator,
    publish_session,
    unpublish_session,
    update_session,
)


class PublicSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """Public catalog and detail endpoints."""

    serializer_class = SessionReadSerializer
    permission_classes = [IsCreatorOrReadOnly, PublishedSessionOnly]
    filterset_class = SessionFilter
    search_fields = ("title", "description", "category")
    ordering_fields = ("scheduled_at", "created_at", "price", "capacity")
    ordering = ("-scheduled_at",)

    def get_queryset(self):
        qs = list_published_sessions()
        if self.action == "list":
            qs = annotate_with_booking_counts(qs)
        return qs

    @extend_schema(
        summary="List published sessions.",
        parameters=[
            OpenApiParameter("search", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("ordering", str, OpenApiParameter.QUERY, required=False),
        ],
    )
    def list(self, request: Request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Get a session by id.")
    def retrieve(self, request: Request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class CreatorSessionViewSet(viewsets.ModelViewSet):
    """Creator-only CRUD for the sessions they own."""

    serializer_class = SessionReadSerializer
    permission_classes = [IsAuthenticated, IsCreator, IsSessionOwner]
    filterset_class = SessionFilter
    search_fields = ("title", "description", "category")
    ordering_fields = ("scheduled_at", "created_at", "price", "capacity")
    ordering = ("-scheduled_at",)
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self):
        user = get_current_user(self.request)
        qs = list_sessions_for_creator(user)
        if self.action == "list":
            qs = annotate_with_booking_counts(qs)
        return qs

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return SessionWriteSerializer
        return SessionReadSerializer

    # -- Status actions --------------------------------------------------- #

    @extend_schema(
        request=SessionStatusUpdateSerializer,
        responses=SessionReadSerializer,
        summary="Publish, unpublish, or archive a session.",
    )
    @action(detail=True, methods=["post"], url_path="status")
    def set_status(self, request: Request, pk: str | None = None):
        session = self.get_object()
        serializer = SessionStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_name = serializer.validated_data["action"]
        if action_name == "publish":
            session = publish_session(session)
        elif action_name == "unpublish":
            session = unpublish_session(session)
        else:
            session = archive_session(session)
        return Response(SessionReadSerializer(session).data, status=status.HTTP_200_OK)

    # -- Filtering helpers ------------------------------------------------ #

    @extend_schema(
        summary="List sessions created by the current creator.",
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Create a new session.",
        request=SessionWriteSerializer,
        responses=SessionReadSerializer,
    )
    def create(self, request, *args, **kwargs):
        write_serializer = SessionWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        user = get_current_user(request)
        session = create_session(user, write_serializer.validated_data.copy())
        session = (
            list_sessions_for_creator(user)
            .prefetch_related("tags", "images")
            .get(pk=session.pk)
        )
        return Response(
            SessionReadSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Update a session.",
        request=SessionWriteSerializer,
        responses=SessionReadSerializer,
    )
    def partial_update(self, request, *args, **kwargs):
        session = self.get_object()
        write_serializer = SessionWriteSerializer(
            data=request.data, partial=True
        )
        write_serializer.is_valid(raise_exception=True)
        updated = update_session(session, write_serializer.validated_data.copy())
        return Response(SessionReadSerializer(updated).data, status=status.HTTP_200_OK)

    @extend_schema(summary="Delete a session.", responses={204: None})
    def destroy(self, request, *args, **kwargs):
        session = self.get_object()
        delete_session(session)
        return Response(status=status.HTTP_204_NO_CONTENT)