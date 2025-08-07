import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

// API 기본 URL 설정
const getApiBaseUrl = () => {
  // 환경 변수가 설정되어 있으면 우선 사용
  if (process.env.REACT_APP_API_URL) {
    console.log("환경 변수에서 API URL 사용:", process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  const hostname = window.location.hostname;
  console.log("현재 호스트명:", hostname);

  // 프로덕션 환경에서는 NGROK URL 사용
  if (hostname === "eieconcierge.com" || hostname === "www.eieconcierge.com") {
    const ngrokUrl = "https://be8b2c8c5bb3.ngrok-free.app";
    console.log("프로덕션 환경에서 NGROK URL 사용:", ngrokUrl);
    return ngrokUrl;
  }

  const localUrl = `http://${hostname}:3001`;
  console.log("로컬 환경에서 URL 사용:", localUrl);
  return localUrl;
};

const API_BASE_URL = getApiBaseUrl();

// 초기 상태
const initialState = {
  timerLogs: [],
  blockLogs: [],
  workSessions: [],
  productivityData: {
    daily: {},
    weekly: {},
    monthly: {},
  },
  aiAnalysis: null,
  currentDate: new Date().toISOString().split("T")[0],
  todayStats: {
    workTime: 0,
    completedTasks: 0,
    focusScore: 0,
    productivity: 0,
  },
  isLoading: false,
  error: null,
};

// 액션 타입
const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_TIMER_LOGS: "SET_TIMER_LOGS",
  SET_BLOCK_LOGS: "SET_BLOCK_LOGS",
  SET_WORK_SESSIONS: "SET_WORK_SESSIONS",
  SET_PRODUCTIVITY_DATA: "SET_PRODUCTIVITY_DATA",
  SET_AI_ANALYSIS: "SET_AI_ANALYSIS",
  SET_CURRENT_DATE: "SET_CURRENT_DATE",
  SET_TODAY_STATS: "SET_TODAY_STATS",
  ADD_TIMER_LOG: "ADD_TIMER_LOG",
  ADD_BLOCK_LOG: "ADD_BLOCK_LOG",
  ADD_WORK_SESSION: "ADD_WORK_SESSION",
  UPDATE_WORK_SESSION: "UPDATE_WORK_SESSION",
  DELETE_WORK_SESSION: "DELETE_WORK_SESSION",
  SYNC_LOGS: "SYNC_LOGS",
};

// 리듀서
const productivityReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ACTIONS.SET_TIMER_LOGS:
      return { ...state, timerLogs: action.payload };
    case ACTIONS.SET_BLOCK_LOGS:
      return { ...state, blockLogs: action.payload };
    case ACTIONS.SET_WORK_SESSIONS:
      return { ...state, workSessions: action.payload };
    case ACTIONS.SET_PRODUCTIVITY_DATA:
      return { ...state, productivityData: action.payload };
    case ACTIONS.SET_AI_ANALYSIS:
      return { ...state, aiAnalysis: action.payload };
    case ACTIONS.SET_CURRENT_DATE:
      return { ...state, currentDate: action.payload };
    case ACTIONS.SET_TODAY_STATS:
      return { ...state, todayStats: action.payload };
    case ACTIONS.ADD_TIMER_LOG:
      return { ...state, timerLogs: [...state.timerLogs, action.payload] };
    case ACTIONS.ADD_BLOCK_LOG:
      return { ...state, blockLogs: [...state.blockLogs, action.payload] };
    case ACTIONS.ADD_WORK_SESSION:
      return {
        ...state,
        workSessions: [...state.workSessions, action.payload],
      };
    case ACTIONS.UPDATE_WORK_SESSION:
      return {
        ...state,
        workSessions: state.workSessions.map((session) =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
      };
    case ACTIONS.DELETE_WORK_SESSION:
      return {
        ...state,
        workSessions: state.workSessions.filter(
          (session) => session.id !== action.payload
        ),
      };
    case ACTIONS.SYNC_LOGS:
      return {
        ...state,
        timerLogs: action.payload.timerLogs || state.timerLogs,
        blockLogs: action.payload.blockLogs || state.blockLogs,
      };
    default:
      return state;
  }
};

// Context 생성
const ProductivityContext = createContext();

// Provider 컴포넌트
export const ProductivityProvider = ({ children }) => {
  const [state, dispatch] = useReducer(productivityReducer, {
    ...initialState,
    currentDate:
      localStorage.getItem("productivity_current_date") ||
      initialState.currentDate,
  });

  // 로컬 스토리지 저장 함수
  const saveToLocalStorage = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("데이터 저장 실패:", error);
    }
  }, []);

  // 로컬 스토리지에서 불러오기
  const loadFromLocalStorage = useCallback((key, defaultValue = []) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
      return defaultValue;
    }
  }, []);

  // 차단 시간 계산
  const calculateBlockTime = useCallback(() => {
    const todayBlockLogs = state.blockLogs.filter(
      (log) => log.date === state.currentDate
    );
    return todayBlockLogs.reduce((total, log) => {
      if (log.duration) {
        return total + log.duration;
      }
      return total;
    }, 0);
  }, [state.blockLogs, state.currentDate]);

  // 오늘 통계 계산
  const calculateTodayStats = useCallback(() => {
    const todaySessions = state.workSessions.filter((session) => {
      const sessionDate = session.date || state.currentDate;
      return sessionDate === state.currentDate;
    });

    const totalWorkTime = todaySessions.reduce((total, session) => {
      if (session.startTime && session.endTime) {
        const start = new Date(`2000-01-01T${session.startTime}`);
        const end = new Date(`2000-01-01T${session.endTime}`);
        const diffHours = (end - start) / (1000 * 60 * 60);
        return total + Math.max(0, diffHours);
      }
      return total;
    }, 0);

    const completedTasks = todaySessions.filter(
      (session) => session.completed
    ).length;
    const totalTasks = todaySessions.length;
    const focusScore =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const productivity = Math.round(
      Math.min(
        100,
        (totalWorkTime / 8) * 40 + (completedTasks / 10) * 30 + focusScore * 0.3
      )
    );

    const newStats = {
      workTime: Math.round(totalWorkTime * 10) / 10,
      completedTasks,
      focusScore,
      productivity,
    };

    dispatch({ type: ACTIONS.SET_TODAY_STATS, payload: newStats });

    // 생산성 데이터 업데이트
    const updatedProductivityData = {
      ...state.productivityData,
      daily: {
        ...state.productivityData.daily,
        [state.currentDate]: {
          workTime: newStats.workTime,
          breakTime: Math.max(0, 8 - newStats.workTime),
          completedTasks: newStats.completedTasks,
          focusScore: newStats.focusScore,
          // calculateBlockTime을 인라인으로 계산하여 의존성 문제 해결
          blockTime: state.blockLogs
            .filter((log) => log.date === state.currentDate)
            .reduce((total, log) => total + (log.duration || 0), 0),
          productivity: newStats.productivity,
        },
      },
    };

    dispatch({
      type: ACTIONS.SET_PRODUCTIVITY_DATA,
      payload: updatedProductivityData,
    });
    saveToLocalStorage("productivity_data", updatedProductivityData);
  }, [
    state.workSessions,
    state.currentDate,
    // state.productivityData를 의존성에서 제거하여 무한 루프 방지
    // saveToLocalStorage와 calculateBlockTime을 의존성에서 제거하여 무한 루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  // 타이머 로그 추가
  const addTimerLog = useCallback(
    async (duration, type) => {
      const newLog = {
        id: Date.now(),
        date: state.currentDate,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        duration,
        type,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/timer-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration, type }),
        });

        if (response.ok) {
          dispatch({ type: ACTIONS.ADD_TIMER_LOG, payload: newLog });
          console.log("타이머 로그가 서버에 저장되었습니다.");
        } else {
          dispatch({ type: ACTIONS.ADD_TIMER_LOG, payload: newLog });
          saveToLocalStorage("productivity_timer_logs", [
            ...state.timerLogs,
            newLog,
          ]);
          console.error("서버 저장 실패, localStorage에 저장");
        }
      } catch (error) {
        dispatch({ type: ACTIONS.ADD_TIMER_LOG, payload: newLog });
        saveToLocalStorage("productivity_timer_logs", [
          ...state.timerLogs,
          newLog,
        ]);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.currentDate, state.timerLogs, saveToLocalStorage]
  );

  // 차단 로그 추가
  const addBlockLog = useCallback(
    async (duration, reason) => {
      const newLog = {
        id: Date.now(),
        date: state.currentDate,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        duration,
        reason,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/block-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration, reason }),
        });

        if (response.ok) {
          dispatch({ type: ACTIONS.ADD_BLOCK_LOG, payload: newLog });
          console.log("차단 로그가 서버에 저장되었습니다.");
        } else {
          dispatch({ type: ACTIONS.ADD_BLOCK_LOG, payload: newLog });
          saveToLocalStorage("productivity_block_logs", [
            ...state.blockLogs,
            newLog,
          ]);
          console.error("서버 저장 실패, localStorage에 저장");
        }
      } catch (error) {
        dispatch({ type: ACTIONS.ADD_BLOCK_LOG, payload: newLog });
        saveToLocalStorage("productivity_block_logs", [
          ...state.blockLogs,
          newLog,
        ]);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.currentDate, state.blockLogs, saveToLocalStorage]
  );

  // 작업 세션 추가
  const addWorkSession = useCallback(
    async (session) => {
      const newSession = {
        id: Date.now(),
        ...session,
        date: state.currentDate,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/work-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSession),
        });

        if (response.ok) {
          dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
          console.log("작업 세션이 서버에 저장되었습니다.");
        } else {
          dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
          saveToLocalStorage("productivity_work_sessions", [
            ...state.workSessions,
            newSession,
          ]);
          console.error("서버 저장 실패, localStorage에 저장");
        }
      } catch (error) {
        dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
        saveToLocalStorage("productivity_work_sessions", [
          ...state.workSessions,
          newSession,
        ]);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.currentDate, state.workSessions, saveToLocalStorage]
  );

  // 작업 세션 업데이트
  const updateWorkSession = useCallback(
    async (id, updates) => {
      const updatedSessions = state.workSessions.map((session) =>
        session.id === id ? { ...session, ...updates } : session
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/work-sessions/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        if (response.ok) {
          dispatch({
            type: ACTIONS.UPDATE_WORK_SESSION,
            payload: updatedSessions,
          });
          console.log("작업 세션이 서버에서 업데이트되었습니다.");
        } else {
          dispatch({
            type: ACTIONS.UPDATE_WORK_SESSION,
            payload: updatedSessions,
          });
          saveToLocalStorage("productivity_work_sessions", updatedSessions);
          console.error("서버 업데이트 실패, localStorage에 저장");
        }
      } catch (error) {
        dispatch({
          type: ACTIONS.UPDATE_WORK_SESSION,
          payload: updatedSessions,
        });
        saveToLocalStorage("productivity_work_sessions", updatedSessions);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.workSessions, saveToLocalStorage]
  );

  // 작업 세션 삭제
  const deleteWorkSession = useCallback(
    async (id) => {
      const filteredSessions = state.workSessions.filter(
        (session) => session.id !== id
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/work-sessions/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
          console.log("작업 세션이 서버에서 삭제되었습니다.");
        } else {
          dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
          saveToLocalStorage("productivity_work_sessions", filteredSessions);
          console.error("서버 삭제 실패, localStorage에 저장");
        }
      } catch (error) {
        dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
        saveToLocalStorage("productivity_work_sessions", filteredSessions);
        console.error("서버 연결 실패, localStorage에 저장:", error);
      }
    },
    [state.workSessions, saveToLocalStorage]
  );

  // 데이터 로드
  const loadData = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      // API_BASE_URL이 비어있으면 오프라인 모드
      if (!API_BASE_URL) {
        console.log("오프라인 모드로 실행 중");
        const savedTimerLogs = loadFromLocalStorage("productivity_timer_logs");
        const savedBlockLogs = loadFromLocalStorage("productivity_block_logs");
        const savedWorkSessions = loadFromLocalStorage(
          "productivity_work_sessions"
        );
        const savedProductivityData = loadFromLocalStorage(
          "productivity_data",
          {
            daily: {},
            weekly: {},
            monthly: {},
          }
        );
        const savedAiAnalysis = loadFromLocalStorage(
          "productivity_ai_analysis"
        );

        dispatch({ type: ACTIONS.SET_TIMER_LOGS, payload: savedTimerLogs });
        dispatch({ type: ACTIONS.SET_BLOCK_LOGS, payload: savedBlockLogs });
        dispatch({
          type: ACTIONS.SET_WORK_SESSIONS,
          payload: savedWorkSessions,
        });
        dispatch({
          type: ACTIONS.SET_PRODUCTIVITY_DATA,
          payload: savedProductivityData,
        });
        if (savedAiAnalysis && typeof savedAiAnalysis === "object") {
          dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: savedAiAnalysis });
        }
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/timer-logs`);
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: ACTIONS.SET_TIMER_LOGS, payload: data.timerLogs });
        dispatch({ type: ACTIONS.SET_BLOCK_LOGS, payload: data.blockLogs });
        dispatch({
          type: ACTIONS.SET_WORK_SESSIONS,
          payload: data.workSessions,
        });
        dispatch({
          type: ACTIONS.SET_PRODUCTIVITY_DATA,
          payload: data.productivityData,
        });
        if (data.aiAnalysis && typeof data.aiAnalysis === "object") {
          dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: data.aiAnalysis });
        }
        console.log("데이터 로드 완료");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      console.log("오프라인 모드로 전환");

      // 오프라인 모드로 전환
      const savedTimerLogs = loadFromLocalStorage("productivity_timer_logs");
      const savedBlockLogs = loadFromLocalStorage("productivity_block_logs");
      const savedWorkSessions = loadFromLocalStorage(
        "productivity_work_sessions"
      );
      const savedProductivityData = loadFromLocalStorage("productivity_data", {
        daily: {},
        weekly: {},
        monthly: {},
      });
      const savedAiAnalysis = loadFromLocalStorage("productivity_ai_analysis");
      dispatch({ type: ACTIONS.SET_TIMER_LOGS, payload: savedTimerLogs });
      dispatch({ type: ACTIONS.SET_BLOCK_LOGS, payload: savedBlockLogs });
      dispatch({
        type: ACTIONS.SET_WORK_SESSIONS,
        payload: savedWorkSessions,
      });
      dispatch({
        type: ACTIONS.SET_PRODUCTIVITY_DATA,
        payload: savedProductivityData,
      });
      if (savedAiAnalysis && typeof savedAiAnalysis === "object") {
        dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: savedAiAnalysis });
      }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [loadFromLocalStorage]);

  // 로그 동기화
  const syncLogs = useCallback(async () => {
    const localTimerLogs = loadFromLocalStorage("productivity_timer_logs");
    const localBlockLogs = loadFromLocalStorage("productivity_block_logs");

    if (localTimerLogs.length > 0 || localBlockLogs.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sync-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timerLogs: localTimerLogs,
            blockLogs: localBlockLogs,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: ACTIONS.SYNC_LOGS, payload: data });
          localStorage.removeItem("productivity_timer_logs");
          localStorage.removeItem("productivity_block_logs");
          console.log("로그 동기화 완료");
        }
      } catch (error) {
        console.error("로그 동기화 실패:", error);
      }
    }
  }, [loadFromLocalStorage]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 통계 계산
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    calculateTodayStats();
  }, []); // calculateTodayStats 의존성 제거하여 무한 루프 방지

  const value = {
    ...state,
    addTimerLog,
    addBlockLog,
    addWorkSession,
    updateWorkSession,
    deleteWorkSession,
    loadData,
    syncLogs,
    calculateTodayStats,
    calculateBlockTime,
    setCurrentDate: (date) => {
      dispatch({ type: ACTIONS.SET_CURRENT_DATE, payload: date });
      localStorage.setItem("productivity_current_date", date);
    },
    setAiAnalysis: (analysis) => {
      dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: analysis });
      saveToLocalStorage("productivity_ai_analysis", analysis);
    },
  };

  return (
    <ProductivityContext.Provider value={value}>
      {children}
    </ProductivityContext.Provider>
  );
};

// Hook
export const useProductivity = () => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error(
      "useProductivity must be used within a ProductivityProvider"
    );
  }
  return context;
};
