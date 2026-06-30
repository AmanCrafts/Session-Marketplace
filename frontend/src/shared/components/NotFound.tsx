import { Link } from "react-router-dom";
import { Card } from "./Card";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card padding="lg" className="max-w-md text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-slate-500">
          We couldn't find what you were looking for.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Back to home
        </Link>
      </Card>
    </div>
  );
}

export default NotFoundPage;
