import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
} from "lucide-react";
import NotificationBanner from "./NotificationBanner";
import AlgorithmProblemModal from "./AlgorithmProblemModal";

const BlockPage = () => {
  const [blockedSites, setBlockedSites] = useState([]);
  const [blockStats, setBlockStats] = useState({
    totalBlocks: 0,
    todayBlocks: 0,
    weeklyBlocks: 0,
    monthlyBlocks: 0,
  });
  const [isBlockingEnabled, setIsBlockingEnabled] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [blockSchedule, setBlockSchedule] = useState({
    startTime: "09:00",
    endTime: "18:00",
    days: ["월", "화", "수", "목", "금"],
  });

  // 알고리즘 문제 관련 상태
  const [algorithmProblem, setAlgorithmProblem] = useState(null);
  const [isAlgorithmModalOpen, setIsAlgorithmModalOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'stop' 또는 'schedule'

  // 차단할 사이트 목록
  const defaultBlockedSites = useMemo(
    () => [
      {
        name: "YouTube",
        domain: "youtube.com",
        category: "video",
        isBlocked: true,
      },
      {
        name: "Facebook",
        domain: "facebook.com",
        category: "social",
        isBlocked: true,
      },
      {
        name: "Instagram",
        domain: "instagram.com",
        category: "social",
        isBlocked: true,
      },
      {
        name: "Twitter",
        domain: "twitter.com",
        category: "social",
        isBlocked: true,
      },
      {
        name: "TikTok",
        domain: "tiktok.com",
        category: "video",
        isBlocked: true,
      },
      {
        name: "Reddit",
        domain: "reddit.com",
        category: "social",
        isBlocked: true,
      },
      {
        name: "Netflix",
        domain: "netflix.com",
        category: "video",
        isBlocked: false,
      },
      {
        name: "Twitch",
        domain: "twitch.tv",
        category: "video",
        isBlocked: false,
      },
      {
        name: "Discord",
        domain: "discord.com",
        category: "social",
        isBlocked: false,
      },
      {
        name: "Telegram",
        domain: "telegram.org",
        category: "social",
        isBlocked: false,
      },
    ],
    []
  );

  // 백엔드에서 차단 상태 가져오기
  const fetchBlockStatus = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/block/status");
      const data = await response.json();

      if (data.success) {
        setIsBlockingEnabled(data.isBlockingEnabled);
        setIsScheduleActive(data.isScheduleActive || false);
        setBlockStats(
          data.blockStats || {
            totalBlocks: 0,
            todayBlocks: 0,
            weeklyBlocks: 0,
            monthlyBlocks: 0,
          }
        );

        // 사용자 설정이 있으면 적용
        if (data.userSettings?.blockedSites) {
          setBlockedSites((prev) =>
            prev.map((site) => ({
              ...site,
              isBlocked: data.userSettings.blockedSites.includes(site.domain),
            }))
          );
        }

        if (data.userSettings?.blockSchedule) {
          setBlockSchedule(data.userSettings.blockSchedule);
        }
      }
    } catch (error) {
      console.error("차단 상태 가져오기 실패:", error);
    }
  }, []); // 의존성 배열을 비워서 무한 루프 방지

  useEffect(() => {
    setBlockedSites(defaultBlockedSites);
    // 페이지 로드 시 백엔드에서 차단 상태 가져오기
    fetchBlockStatus();
  }, [defaultBlockedSites]); // fetchBlockStatus 제거하여 무한 루프 방지

  // 알고리즘 문제 풀이 제출
  const handleAlgorithmSubmit = async (code) => {
    setIsSubmittingCode(true);
    setTestResults(null);

    try {
      let endpoint = "";
      let requestBody = {
        code,
        problemId: algorithmProblem.id,
      };

      if (pendingAction === "stop") {
        endpoint = "http://localhost:3001/api/block/stop";
      } else if (pendingAction === "schedule") {
        endpoint = "http://localhost:3001/api/settings/block-schedule";
        requestBody = {
          ...requestBody,
          startTime: blockSchedule.startTime,
          endTime: blockSchedule.endTime,
          days: blockSchedule.days,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        // 성공 시 모달 닫기
        setIsAlgorithmModalOpen(false);
        setAlgorithmProblem(null);
        setPendingAction(null);

        setNotification({
          show: true,
          message: data.message || "✅ 알고리즘 문제 풀이 성공!",
          type: "success",
        });

        // 상태 업데이트
        if (pendingAction === "stop") {
          setIsBlockingEnabled(false);
        }

        // 페이지 새로고침으로 최신 상태 가져오기
        fetchBlockStatus();
      } else {
        // 실패 시 테스트 결과 표시
        if (data.testResults) {
          setTestResults(data.testResults);
        }

        setNotification({
          show: true,
          message: data.error || "❌ 문제 풀이 실패",
          type: "error",
        });
      }
    } catch (error) {
      setNotification({
        show: true,
        message: "❌ 서버 연결 오류: " + error.message,
        type: "error",
      });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // 실제 차단 API 호출
  const callBlockAPI = async (action) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/block/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        if (action === "start") {
          setIsBlockingEnabled(true);
          setBlockStats(data.blockStats);
        } else {
          setIsBlockingEnabled(false);
        }
      }

      return data;
    } catch (error) {
      console.error("차단 API 호출 실패:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 차단 시작
  const startBlocking = async () => {
    const result = await callBlockAPI("start");
    if (result.success) {
      setNotification({
        show: true,
        message: "🛡️ 집중 모드 차단이 시작되었습니다!",
        type: "success",
      });
    } else {
      setNotification({
        show: true,
        message: "❌ 차단 시작 실패: " + result.error,
        type: "error",
      });
    }
  };

  // 차단 중지
  const stopBlocking = async () => {
    if (!window.confirm("정말로 집중 모드 차단을 중지하시겠습니까?")) return;

    const result = await callBlockAPI("stop");
    if (result.success) {
      setNotification({
        show: true,
        message: "✅ 집중 모드 차단이 중지되었습니다!",
        type: "success",
      });
    } else {
      // 알고리즘 문제 풀이가 필요한 경우
      if (result.requiresProblem && result.problem) {
        setAlgorithmProblem(result.problem);
        setPendingAction("stop");
        setIsAlgorithmModalOpen(true);
        setTestResults(null);
        return;
      }

      // 스케줄 차단 중인 경우 특별한 메시지 표시
      if (result.scheduleInfo?.isScheduleActive) {
        const { currentDay, endTime } = result.scheduleInfo;
        setNotification({
          show: true,
          message: `⏰ 스케줄 차단 시간 중입니다. ${currentDay} ${endTime}까지 차단이 유지됩니다.`,
          type: "warning",
        });
      } else {
        setNotification({
          show: true,
          message: "❌ 차단 중지 실패: " + result.error,
          type: "error",
        });
      }
    }
  };

  // 사이트 차단/해제 토글
  const toggleSiteBlock = async (domain) => {
    const updatedSites = blockedSites.map((site) =>
      site.domain === domain ? { ...site, isBlocked: !site.isBlocked } : site
    );
    setBlockedSites(updatedSites);

    // 백엔드에 설정 저장
    try {
      const blockedDomains = updatedSites
        .filter((site) => site.isBlocked)
        .map((site) => site.domain);

      await fetch("http://localhost:3001/api/settings/blocked-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedSites: blockedDomains }),
      });

      // 설정 저장 알림
      setNotification({
        show: true,
        message: "💾 차단 사이트 설정이 저장되었습니다.",
        type: "success",
      });
    } catch (error) {
      console.error("차단 사이트 설정 저장 실패:", error);
      setNotification({
        show: true,
        message: "❌ 설정 저장 실패: " + error.message,
        type: "error",
      });
    }
  };

  // 전체 차단/해제
  const toggleAllSites = async (block) => {
    const updatedSites = blockedSites.map((site) => ({
      ...site,
      isBlocked: block,
    }));
    setBlockedSites(updatedSites);

    // 백엔드에 설정 저장
    try {
      const blockedDomains = updatedSites
        .filter((site) => site.isBlocked)
        .map((site) => site.domain);

      await fetch("http://localhost:3001/api/settings/blocked-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedSites: blockedDomains }),
      });

      // 설정 저장 알림
      setNotification({
        show: true,
        message: "💾 차단 사이트 설정이 저장되었습니다.",
        type: "success",
      });
    } catch (error) {
      console.error("차단 사이트 설정 저장 실패:", error);
      setNotification({
        show: true,
        message: "❌ 설정 저장 실패: " + error.message,
        type: "error",
      });
    }
  };

  // 카테고리별 필터링
  const getSitesByCategory = (category) => {
    return blockedSites?.filter((site) => site.category === category) || [];
  };

  // 스케줄 설정을 백엔드에 저장
  const saveBlockSchedule = useCallback(async (newSchedule) => {
    try {
      const response = await fetch(
        "http://localhost:3001/api/settings/block-schedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: newSchedule.startTime,
            endTime: newSchedule.endTime,
            days: newSchedule.days,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // 설정 저장 알림
        setNotification({
          show: true,
          message: data.message || "⏰ 차단 스케줄 설정이 저장되었습니다.",
          type: "success",
        });
      } else {
        // 알고리즘 문제 풀이가 필요한 경우
        if (data.requiresProblem && data.problem) {
          setAlgorithmProblem(data.problem);
          setPendingAction("schedule");
          setIsAlgorithmModalOpen(true);
          setTestResults(null);
          return;
        }

        setNotification({
          show: true,
          message: "❌ 스케줄 저장 실패: " + data.error,
          type: "error",
        });
      }
    } catch (error) {
      console.error("차단 스케줄 설정 저장 실패:", error);
      setNotification({
        show: true,
        message: "❌ 스케줄 설정 저장 실패: " + error.message,
        type: "error",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Shield className="text-red-600" size={40} />
            집중 모드 차단 시스템
          </h1>
          <p className="text-gray-600 text-lg">
            방해 요소를 차단하고 집중력을 극대화하세요
          </p>
        </div>

        {/* 상태 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  isBlockingEnabled ? "bg-green-500" : "bg-gray-300"
                }`}
              ></div>
              <span className="text-lg font-semibold text-gray-800">
                {isBlockingEnabled
                  ? isScheduleActive
                    ? "스케줄 차단 활성화"
                    : "차단 시스템 활성화"
                  : "차단 시스템 비활성화"}
              </span>
              {isScheduleActive && (
                <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  ⏰ 스케줄
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={startBlocking}
                disabled={isLoading || isBlockingEnabled}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isLoading || isBlockingEnabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isLoading ? "처리 중..." : "차단 시작"}
              </button>
              <button
                onClick={stopBlocking}
                disabled={isLoading || !isBlockingEnabled || isScheduleActive}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isLoading || !isBlockingEnabled || isScheduleActive
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isLoading
                  ? "처리 중..."
                  : isScheduleActive
                  ? "스케줄 차단 중"
                  : "차단 중지"}
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {blockStats.totalBlocks}
              </div>
              <div className="text-sm text-gray-600">총 차단 사이트</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {blockStats.todayBlocks}
              </div>
              <div className="text-sm text-gray-600">오늘 차단 횟수</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {blockStats.weeklyBlocks}
              </div>
              <div className="text-sm text-gray-600">이번 주 차단</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {blockStats.monthlyBlocks}
              </div>
              <div className="text-sm text-gray-600">이번 달 차단</div>
            </div>
          </div>
        </div>

        {/* 차단 설정 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 사이트 차단 관리 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Lock size={24} />
                사이트 차단 관리
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAllSites(true)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all"
                >
                  전체 차단
                </button>
                <button
                  onClick={() => toggleAllSites(false)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all"
                >
                  전체 해제
                </button>
              </div>
            </div>

            {/* 비디오 사이트 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Target size={16} />
                비디오 플랫폼
              </h4>
              <div className="space-y-2">
                {getSitesByCategory("video").map((site) => (
                  <div
                    key={site.domain}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          site.isBlocked ? "bg-red-500" : "bg-green-500"
                        }`}
                      ></div>
                      <span className="font-medium">{site.name}</span>
                      <span className="text-sm text-gray-500">
                        ({site.domain})
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSiteBlock(site.domain)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                        site.isBlocked
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {site.isBlocked ? "차단됨" : "허용됨"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 소셜 미디어 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Target size={16} />
                소셜 미디어
              </h4>
              <div className="space-y-2">
                {getSitesByCategory("social").map((site) => (
                  <div
                    key={site.domain}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          site.isBlocked ? "bg-red-500" : "bg-green-500"
                        }`}
                      ></div>
                      <span className="font-medium">{site.name}</span>
                      <span className="text-sm text-gray-500">
                        ({site.domain})
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSiteBlock(site.domain)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                        site.isBlocked
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {site.isBlocked ? "차단됨" : "허용됨"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 차단 스케줄 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Clock size={24} />
              차단 스케줄
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={blockSchedule.startTime}
                  onChange={(e) => {
                    const newSchedule = {
                      ...blockSchedule,
                      startTime: e.target.value,
                    };
                    setBlockSchedule(newSchedule);
                    saveBlockSchedule(newSchedule);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={blockSchedule.endTime}
                  onChange={(e) => {
                    const newSchedule = {
                      ...blockSchedule,
                      endTime: e.target.value,
                    };
                    setBlockSchedule(newSchedule);
                    saveBlockSchedule(newSchedule);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  적용 요일
                </label>
                <div className="flex flex-wrap gap-2">
                  {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        const newDays = blockSchedule.days.includes(day)
                          ? blockSchedule.days.filter((d) => d !== day)
                          : [...blockSchedule.days, day];
                        const newSchedule = {
                          ...blockSchedule,
                          days: newDays,
                        };
                        setBlockSchedule(newSchedule);
                        saveBlockSchedule(newSchedule);
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        blockSchedule.days.includes(day)
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all">
                  스케줄 적용
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 차단 효과 및 팁 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} />
            차단 시스템 효과 및 팁
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                차단 효과
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 집중력 향상 및 업무 효율성 증대</li>
                <li>• 불필요한 시간 낭비 방지</li>
                <li>• 스트레스 감소 및 정신 건강 개선</li>
                <li>• 목표 달성률 향상</li>
                <li>• 디지털 웰빙 증진</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <XCircle size={16} className="text-red-600" />
                주의사항
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 중요한 업무 연락이 차단될 수 있음</li>
                <li>• 긴급 상황 시 차단 해제 필요</li>
                <li>• 브라우저 캐시 초기화 필요할 수 있음</li>
                <li>• VPN 사용 시 차단이 무효화될 수 있음</li>
                <li>• 정기적인 차단 효과 모니터링 권장</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">
              💡 효과적인 사용법
            </h4>
            <p className="text-sm text-blue-700">
              포모도로 타이머와 함께 사용하면 더욱 효과적입니다. 집중 시간 동안
              차단을 활성화하고, 휴식 시간에는 필요한 사이트에 접근할 수 있도록
              설정해보세요.
            </p>
          </div>
        </div>

        {/* 알림 배너 */}
        <NotificationBanner
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={() =>
            setNotification({ show: false, message: "", type: "info" })
          }
        />

        {/* 알고리즘 문제 풀이 모달 */}
        <AlgorithmProblemModal
          isOpen={isAlgorithmModalOpen}
          onClose={() => {
            setIsAlgorithmModalOpen(false);
            setAlgorithmProblem(null);
            setPendingAction(null);
            setTestResults(null);
          }}
          problem={algorithmProblem}
          onSubmit={handleAlgorithmSubmit}
          testResults={testResults}
          isSubmitting={isSubmittingCode}
        />
      </div>
    </div>
  );
};

export default BlockPage;
