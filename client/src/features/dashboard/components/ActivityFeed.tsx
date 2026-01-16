import { motion } from "framer-motion";
import { Activity, Clock } from "lucide-react";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";
import { AnimatedSection, FloatingElement } from "@/presentation/components/effects/AnimatedSection";
import { getRelativeTime } from "@/lib/utils";
import type { ActivityLog } from "@/types";

interface ActivityFeedProps {
    activities: ActivityLog[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <AnimatedSection animation="fadeInUp" delay={0.3} className="h-full">
            <SpatialCard className="p-6 h-full">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FloatingElement floatIntensity={2} duration={4}>
                        <Activity className="w-5 h-5 text-pink-500" />
                    </FloatingElement>
                    최근 활동
                    <span className="ml-2 text-sm font-normal text-gray-400">최근 7일</span>
                </h3>
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <FloatingElement floatIntensity={8}>
                            <Activity className="w-12 h-12 text-gray-600 mb-4" />
                        </FloatingElement>
                        <p className="text-gray-500">최근 활동이 없습니다</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {activities.slice(0, 10).map((activity, i) => (
                            <motion.div
                                key={activity.id}
                                className="flex gap-3 items-start p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ x: 3 }}
                            >
                                <motion.div
                                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    {activity.member.name.charAt(0)}
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-white font-medium truncate">{activity.member.name}</p>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1 shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {getRelativeTime(activity.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {activity.action === 'created' && '업무를 생성했습니다'}
                                        {activity.action === 'updated' && '업무를 수정했습니다'}
                                        {activity.action === 'moved' && '업무 상태를 변경했습니다'}
                                    </p>
                                    <p className="text-sm text-gray-300 truncate mt-1.5 bg-white/5 px-2 py-1 rounded-lg">
                                        {activity.task?.title}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </SpatialCard>
        </AnimatedSection>
    );
}
