import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

// API 기본 URL 설정
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
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
          blockTime: calculateBlockTime(),
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
    state.productivityData,
    calculateBlockTime,
    saveToLocalStorage,
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
  const addWorkSession = useCallback(() => {
    const newSession = {
      id: Date.now(),
      date: state.currentDate,
      startTime: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: "",
      task: "",
      completed: false,
    };
    dispatch({ type: ACTIONS.ADD_WORK_SESSION, payload: newSession });
    saveToLocalStorage("productivity_work_sessions", [
      ...state.workSessions,
      newSession,
    ]);
  }, [state.currentDate, state.workSessions, saveToLocalStorage]);

  // 작업 세션 업데이트
  const updateWorkSession = useCallback(
    (id, field, value) => {
      dispatch({
        type: ACTIONS.UPDATE_WORK_SESSION,
        payload: { id, updates: { [field]: value } },
      });
      const updatedSessions = state.workSessions.map((session) =>
        session.id === id ? { ...session, [field]: value } : session
      );
      saveToLocalStorage("productivity_work_sessions", updatedSessions);
    },
    [state.workSessions, saveToLocalStorage]
  );

  // 작업 세션 삭제
  const deleteWorkSession = useCallback(
    (id) => {
      dispatch({ type: ACTIONS.DELETE_WORK_SESSION, payload: id });
      const updatedSessions = state.workSessions.filter(
        (session) => session.id !== id
      );
      saveToLocalStorage("productivity_work_sessions", updatedSessions);
    },
    [state.workSessions, saveToLocalStorage]
  );

  // 데이터 로드
  const loadData = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      // 서버에서 데이터 로드
      const [timerResponse, blockResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/timer-logs`),
        fetch(`${API_BASE_URL}/api/block-logs`),
      ]);

      if (timerResponse.ok) {
        const timerData = await timerResponse.json();
        dispatch({
          type: ACTIONS.SET_TIMER_LOGS,
          payload: timerData.logs || [],
        });
      } else {
        const savedTimerLogs = loadFromLocalStorage("productivity_timer_logs");
        dispatch({ type: ACTIONS.SET_TIMER_LOGS, payload: savedTimerLogs });
      }

      if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        dispatch({
          type: ACTIONS.SET_BLOCK_LOGS,
          payload: blockData.logs || [],
        });
      } else {
        const savedBlockLogs = loadFromLocalStorage("productivity_block_logs");
        dispatch({ type: ACTIONS.SET_BLOCK_LOGS, payload: savedBlockLogs });
      }

      // 로컬 스토리지에서 데이터 로드
      const savedWorkSessions = loadFromLocalStorage(
        "productivity_work_sessions"
      );
      const savedProductivityData = loadFromLocalStorage("productivity_data", {
        daily: {},
        weekly: {},
        monthly: {},
      });
      const savedAiAnalysis = loadFromLocalStorage("productivity_ai_analysis");

      dispatch({ type: ACTIONS.SET_WORK_SESSIONS, payload: savedWorkSessions });
      dispatch({
        type: ACTIONS.SET_PRODUCTIVITY_DATA,
        payload: savedProductivityData,
      });
      if (savedAiAnalysis && typeof savedAiAnalysis === "object") {
        dispatch({ type: ACTIONS.SET_AI_ANALYSIS, payload: savedAiAnalysis });
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
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
  useEffect(() => {
    calculateTodayStats();
  }, [calculateTodayStats]);

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
