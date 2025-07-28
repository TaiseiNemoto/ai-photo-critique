import Link from "next/link";

export function ShareFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
      <p className="text-sm text-gray-500">
        Powered by{" "}
        <Link
          href="/"
          className="text-gray-700 hover:text-gray-900 font-medium"
        >
          Photo-Critique
        </Link>
      </p>
    </div>
  );
}
