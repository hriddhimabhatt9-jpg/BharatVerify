import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen animated-bg flex items-center justify-center p-4">
            <div className="glass-card-strong max-w-md w-full p-8 text-center">
                {/* 404 Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg shadow-gray-500/30">
                    <span className="text-2xl font-bold text-white">404</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Page Not Found
                </h1>
                <p className="text-gray-600 mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 transition-all"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
