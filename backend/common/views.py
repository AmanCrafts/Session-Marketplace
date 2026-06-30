from django.http import JsonResponse


def index(_request):
    return JsonResponse({"service": "sessions-marketplace-api"})