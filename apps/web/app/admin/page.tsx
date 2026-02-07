"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BentoCard,
    BentoGrid,
    StatCard,
    GlassButton,
} from "@/components/ui";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface Application {
    id: string;
    name: string;
    type: string;
    email: string;
    registrationNumber: string;
    role: "issuer" | "verifier";
    status: "pending" | "approved" | "rejected";
    isAuthorizedOnChain: boolean;
    walletAddress?: string;
    website?: string;
    city?: string;
    state?: string;
    createdAt: string;
}

interface ActivityLog {
    id: string;
    eventType: string;
    actorType: string;
    timestamp: string;
    metadata?: Record<string, any>;
    txHash?: string;
}

interface AdminStats {
    pendingApplications: number;
    approvedTotal: number;
    rejectedTotal: number;
    issuers: number;
    verifiers: number;
    authorizedOnChain: number;
}

// ============================================
// COMPONENT
// ============================================

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [pendingApps, setPendingApps] = useState<Application[]>([]);
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setError("Not authenticated. Please login.");
                setIsLoading(false);
                return;
            }

            const response = await fetch("/api/admin/stats", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Failed to load dashboard");
                return;
            }

            setStats(data.stats);
            setPendingApps(data.pendingApplications);
            setRecentActivity(data.recentActivity);
        } catch (err) {
            setError("Failed to connect to server");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle approve
    const handleApprove = async (appId: string) => {
        setProcessingId(appId);
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch("/api/admin/applications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    applicationId: appId,
                    action: "approve",
                }),
            });

            const data = await response.json();
            if (data.success) {
                fetchData(); // Refresh
            } else {
                alert(data.error);
            }
        } catch {
            alert("Failed to approve application");
        } finally {
            setProcessingId(null);
        }
    };

    // Handle reject
    const handleReject = async (appId: string) => {
        if (!rejectReason.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }

        setProcessingId(appId);
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch("/api/admin/applications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    applicationId: appId,
                    action: "reject",
                    reason: rejectReason,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setShowRejectModal(null);
                setRejectReason("");
                fetchData();
            } else {
                alert(data.error);
            }
        } catch {
            alert("Failed to reject application");
        } finally {
            setProcessingId(null);
        }
    };

    // Format event type for display
    const formatEventType = (type: string) => {
        return type
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen animated-bg flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen animated-bg flex items-center justify-center p-4">
                <div className="glass-card-strong max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link href="/login">
                        <GlassButton variant="primary">Go to Login</GlassButton>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen animated-bg">
            {/* Header */}
            <header className="glass-card-strong border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold">B</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                    </div>
                    <Link href="/">
                        <GlassButton variant="glass" size="sm">
                            ← Back to Home
                        </GlassButton>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BentoGrid>
                    {/* Stats Row */}
                    <StatCard
                        value={stats?.pendingApplications || 0}
                        label="Pending Applications"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        value={stats?.issuers || 0}
                        label="Active Issuers"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        value={stats?.verifiers || 0}
                        label="Active Verifiers"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />

                    {/* Pending Applications */}
                    <BentoCard title="Pending Applications" subtitle="Review and approve or reject" span={8}>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {pendingApps.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>No pending applications</p>
                                </div>
                            ) : (
                                pendingApps.map((app) => (
                                    <motion.div
                                        key={app.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-card p-4 flex flex-col md:flex-row md:items-center gap-4"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">{app.name}</h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${app.role === "issuer"
                                                        ? "bg-violet-100 text-violet-700"
                                                        : "bg-sky-100 text-sky-700"
                                                    }`}>
                                                    {app.role}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{app.email}</p>
                                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                                <span>Type: {app.type}</span>
                                                <span>•</span>
                                                <span>Reg: {app.registrationNumber}</span>
                                                {app.city && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{app.city}, {app.state}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <GlassButton
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleApprove(app.id)}
                                                disabled={processingId === app.id}
                                                isLoading={processingId === app.id}
                                            >
                                                Approve
                                            </GlassButton>
                                            <GlassButton
                                                variant="danger"
                                                size="sm"
                                                onClick={() => setShowRejectModal(app.id)}
                                                disabled={processingId === app.id}
                                            >
                                                Reject
                                            </GlassButton>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </BentoCard>

                    {/* Quick Stats */}
                    <BentoCard title="Overview" span={4}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                                <span className="text-sm text-gray-600">Approved</span>
                                <span className="font-bold text-green-600">{stats?.approvedTotal || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
                                <span className="text-sm text-gray-600">Rejected</span>
                                <span className="font-bold text-red-600">{stats?.rejectedTotal || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-violet-50">
                                <span className="text-sm text-gray-600">On-Chain</span>
                                <span className="font-bold text-violet-600">{stats?.authorizedOnChain || 0}</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Recent Activity */}
                    <BentoCard title="Recent Activity" subtitle="Latest system events" span={12}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-200">
                                        <th className="pb-2">Event</th>
                                        <th className="pb-2">Actor</th>
                                        <th className="pb-2">Details</th>
                                        <th className="pb-2">Time</th>
                                        <th className="pb-2">TX</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-100">
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${log.eventType.includes("APPROVED")
                                                        ? "bg-green-100 text-green-700"
                                                        : log.eventType.includes("REJECTED")
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                    {formatEventType(log.eventType)}
                                                </span>
                                            </td>
                                            <td className="py-3 capitalize">{log.actorType}</td>
                                            <td className="py-3 text-gray-600">
                                                {log.metadata?.organizationName || log.metadata?.role || "-"}
                                            </td>
                                            <td className="py-3 text-gray-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3">
                                                {log.txHash ? (
                                                    <a
                                                        href={`https://amoy.polygonscan.com/tx/${log.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-violet-600 hover:underline"
                                                    >
                                                        View
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {recentActivity.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                No activity yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </BentoCard>
                </BentoGrid>
            </main>

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowRejectModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card-strong p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4">Reject Application</h3>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Please provide a reason for rejection..."
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none h-32"
                            />
                            <div className="flex gap-2 mt-4">
                                <GlassButton
                                    variant="glass"
                                    onClick={() => {
                                        setShowRejectModal(null);
                                        setRejectReason("");
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </GlassButton>
                                <GlassButton
                                    variant="danger"
                                    onClick={() => handleReject(showRejectModal)}
                                    disabled={!rejectReason.trim() || processingId === showRejectModal}
                                    isLoading={processingId === showRejectModal}
                                    className="flex-1"
                                >
                                    Reject
                                </GlassButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
