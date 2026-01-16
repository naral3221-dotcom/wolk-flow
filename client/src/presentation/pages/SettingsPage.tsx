import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Palette,
  Shield,
  Moon,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Mail,
  Clock,
  Camera,
} from "lucide-react";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { SettingsSection, SettingsRow, SettingsDivider } from "@/features/settings/components/SettingsSection";
import { SettingsToggle, SettingsSelect, SettingsButton, SettingsInput } from "@/features/settings/components/SettingsToggle";
import { AnimatedSection, FloatingElement } from "../components/effects/AnimatedSection";
import { SpatialCard } from "../components/ui/SpatialCard";

type TabId = "profile" | "appearance" | "security";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof User;
}

const tabs: Tab[] = [
  { id: "profile", label: "프로필", icon: User },
  { id: "appearance", label: "외관", icon: Palette },
  { id: "security", label: "보안", icon: Shield },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const {
    settings,
    loading,
    updateAppearance,
    updateSecurity,
    resetSettings,
    exportSettings,
    importSettings,
    profile,
    updateProfile,
  } = useSettings();

  const [profileName, setProfileName] = useState(profile?.name || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      // Convert to base64 for local storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateProfile({ avatarUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <FloatingElement floatIntensity={15} rotateIntensity={5}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-violet border-t-transparent" />
            <p className="text-gray-400 animate-pulse">설정을 불러오는 중...</p>
          </div>
        </FloatingElement>
      </div>
    );
  }

  const handleExport = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wolk-flow-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          if (importSettings(json)) {
            alert("설정을 가져왔습니다.");
          } else {
            alert("설정 파일을 읽을 수 없습니다.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <motion.div
      className="p-8 w-full h-full overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <AnimatedSection animation="fadeInDown" className="mb-10">
        <header>
          <FloatingElement floatIntensity={3} rotateIntensity={1} duration={6}>
            <motion.h1
              className="text-4xl font-bold text-white mb-2 tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-violet to-cyan-400">설정</span>
            </motion.h1>
          </FloatingElement>
          <p className="text-gray-400">앱의 동작과 외관을 사용자화하세요.</p>
        </header>
      </AnimatedSection>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tab Navigation */}
        <AnimatedSection animation="fadeInLeft" delay={0.1} className="lg:w-64 shrink-0">
          <SpatialCard className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                    ${activeTab === tab.id
                      ? "bg-linear-to-r from-neon-violet/30 to-transparent text-white border-l-2 border-neon-violet"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </nav>

            <SettingsDivider />

            {/* Quick Actions */}
            <div className="space-y-2 mt-4">
              <motion.button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                whileHover={{ x: 5 }}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">설정 내보내기</span>
              </motion.button>
              <motion.button
                onClick={handleImport}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                whileHover={{ x: 5 }}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">설정 가져오기</span>
              </motion.button>
              <motion.button
                onClick={() => {
                  if (confirm("모든 설정을 초기화하시겠습니까?")) {
                    resetSettings();
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                whileHover={{ x: 5 }}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">설정 초기화</span>
              </motion.button>
            </div>
          </SpatialCard>
        </AnimatedSection>

        {/* Content */}
        <AnimatedSection animation="fadeInRight" delay={0.2} className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <SettingsSection title="프로필 정보" description="기본 프로필 정보를 관리하세요" icon={User}>
                  <div className="flex items-center gap-6 mb-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <motion.div
                      className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                          {profile?.name.charAt(0) || "?"}
                        </div>
                      )}
                      <motion.div
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        whileHover={{ opacity: 1 }}
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </motion.div>
                    </motion.div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{profile?.name}</h4>
                      <p className="text-sm text-gray-400">{profile?.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {profile?.department} · {profile?.position}
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-xs text-neon-violet hover:text-neon-teal transition-colors"
                      >
                        프로필 사진 변경
                      </button>
                    </div>
                  </div>

                  <SettingsRow label="이름" description="표시될 이름을 입력하세요">
                    <div className="flex gap-2">
                      <SettingsInput
                        value={profileName}
                        onChange={setProfileName}
                        placeholder="이름"
                      />
                      <SettingsButton
                        onClick={() => updateProfile({ name: profileName })}
                        variant="secondary"
                      >
                        저장
                      </SettingsButton>
                    </div>
                  </SettingsRow>

                  <SettingsRow label="이메일" description="로그인에 사용되는 이메일">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{profile?.email}</span>
                    </div>
                  </SettingsRow>
                </SettingsSection>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <SettingsSection title="외관 설정" description="앱의 테마와 효과를 설정하세요" icon={Palette}>
                  <SettingsRow label="테마" description="앱의 색상 테마">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-gray-400" />
                      <SettingsSelect
                        value={settings.appearance.theme}
                        onChange={(theme) => updateAppearance({ theme })}
                        options={[
                          { value: "dark", label: "다크" },
                          { value: "light", label: "라이트" },
                          { value: "system", label: "시스템" },
                        ]}
                      />
                    </div>
                  </SettingsRow>

                  <SettingsDivider label="효과" />

                  <SettingsRow label="애니메이션" description="UI 애니메이션 효과">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                      <SettingsToggle
                        enabled={settings.appearance.animationsEnabled}
                        onChange={(enabled) => updateAppearance({ animationsEnabled: enabled })}
                      />
                    </div>
                  </SettingsRow>

                  <SettingsRow label="파티클 효과" description="배경 파티클 애니메이션">
                    <SettingsToggle
                      enabled={settings.appearance.particleEffects}
                      onChange={(enabled) => updateAppearance({ particleEffects: enabled })}
                    />
                  </SettingsRow>

                  <SettingsRow label="컴팩트 모드" description="더 많은 콘텐츠를 표시">
                    <SettingsToggle
                      enabled={settings.appearance.compactMode}
                      onChange={(enabled) => updateAppearance({ compactMode: enabled })}
                    />
                  </SettingsRow>
                </SettingsSection>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <SettingsSection title="보안 설정" description="계정 보안을 관리하세요" icon={Shield}>
                  <SettingsRow label="세션 타임아웃" description="자동 로그아웃 시간 (분)">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <SettingsSelect
                        value={String(settings.security.sessionTimeout)}
                        onChange={(value) => updateSecurity({ sessionTimeout: parseInt(value) })}
                        options={[
                          { value: "15", label: "15분" },
                          { value: "30", label: "30분" },
                          { value: "60", label: "1시간" },
                          { value: "120", label: "2시간" },
                          { value: "480", label: "8시간" },
                        ]}
                      />
                    </div>
                  </SettingsRow>
                </SettingsSection>
              </div>
            )}
          </motion.div>
        </AnimatedSection>
      </div>
    </motion.div>
  );
}
