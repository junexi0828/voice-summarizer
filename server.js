const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { PythonShell } = require("python-shell");

// 알고리즘 문제 시스템 - Python API 연동

const ProblemDifficulty = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
};

const ProblemTag = {
  ARRAY: "ARRAY",
  MATH: "MATH",
  BRUTE_FORCE: "BRUTE_FORCE",
  BINARY_SEARCH: "BINARY_SEARCH",
  STRING: "STRING",
  TWO_POINTERS: "TWO_POINTERS",
  DYNAMIC_PROGRAMMING: "DYNAMIC_PROGRAMMING",
};

const app = express();
const PORT = 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// ----- 설정 관리 -----
const CONFIG = {
  system_paths: {
    hosts_file: "/etc/hosts",
    redirect_ip: "127.0.0.1",
    backup_path: "/Library/Application Support/FocusTimer/hosts_backup",
  },
  blocked_websites: {
    youtube: [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
      "youtube.googleapis.com",
      "www.youtube.googleapis.com",
      "youtubei.googleapis.com",
      "www.youtubei.googleapis.com",
      "yt3.ggpht.com",
      "i.ytimg.com",
      "ytimg.com",
      "www.ytimg.com",
      "googlevideo.com",
      "www.googlevideo.com",
      "shorts.youtube.com",
      "www.shorts.youtube.com",
    ],
    social_media: [
      "facebook.com",
      "www.facebook.com",
      "instagram.com",
      "www.instagram.com",
      "twitter.com",
      "www.twitter.com",
      "x.com",
      "www.x.com",
      "tiktok.com",
      "www.tiktok.com",
      "reddit.com",
      "www.reddit.com",
    ],
    gaming: [
      "twitch.tv",
      "www.twitch.tv",
      "discord.com",
      "www.discord.com",
      "steamcommunity.com",
      "www.steamcommunity.com",
    ],
    entertainment: [
      "netflix.com",
      "www.netflix.com",
      "disneyplus.com",
      "www.disneyplus.com",
      "spotify.com",
      "www.spotify.com",
    ],
  },
  browsers: {
    supported: [
      "Google Chrome",
      "Safari",
      "Firefox",
      "Whale",
      "Microsoft Edge",
    ],
  },
};

// 상태 관리
let isBlockingEnabled = false;
let isScheduleActive = false; // 스케줄 활성화 상태
let blockStats = {
  totalBlocks: 0,
  todayBlocks: 0,
  weeklyBlocks: 0,
  monthlyBlocks: 0,
};

// 사용자 설정 저장소
let userSettings = {
  blockedSites: [],
  blockSchedule: {
    startTime: "09:00",
    endTime: "18:00",
    days: ["월", "화", "수", "목", "금"],
  },
  pomodoroSettings: {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  },
  blockHistory: [],
};

// ----- 유틸리티 함수들 -----
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`명령어 실행 오류: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function log(level, message) {
  const timestamp = new Date().toISOString().replace("T", " ").substr(0, 19);
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  console.log(logEntry);
}

// 설정 파일 관리
const SETTINGS_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  "focus_timer_settings.json"
);

function saveUserSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(userSettings, null, 2));
    log("INFO", "사용자 설정 저장 완료");
  } catch (error) {
    log("ERROR", `사용자 설정 저장 실패: ${error.message}`);
  }
}

function loadUserSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf8");
      userSettings = { ...userSettings, ...JSON.parse(data) };
      log("INFO", "사용자 설정 로드 완료");
    }
  } catch (error) {
    log("ERROR", `사용자 설정 로드 실패: ${error.message}`);
  }
}

// 스케줄 체크 함수
function checkSchedule() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM 형식
  const currentDay = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];

  const { startTime, endTime, days } = userSettings.blockSchedule;

  // 현재 요일이 스케줄에 포함되어 있는지 확인
  const isScheduledDay = days.includes(currentDay);

  // 현재 시간이 스케줄 시간 범위에 있는지 확인
  const isScheduledTime = currentTime >= startTime && currentTime <= endTime;

  const shouldBeBlocked = isScheduledDay && isScheduledTime;

  // 스케줄 상태가 변경되었는지 확인
  if (shouldBeBlocked && !isScheduleActive) {
    log("INFO", `스케줄 차단 시작: ${currentDay} ${currentTime}`);
    isScheduleActive = true;
    // 스케줄에 의한 차단 시작
    startScheduledBlocking();
  } else if (!shouldBeBlocked && isScheduleActive) {
    log("INFO", `스케줄 차단 종료: ${currentDay} ${currentTime}`);
    isScheduleActive = false;
    // 스케줄에 의한 차단 종료
    stopScheduledBlocking();
  }
}

// 스케줄에 의한 차단 시작
async function startScheduledBlocking() {
  if (!isBlockingEnabled) {
    try {
      log("INFO", "🚀 스케줄 차단 시작");

      // hosts 파일 차단
      const blockSuccess = blockWebsites();
      if (!blockSuccess) {
        log("ERROR", "스케줄 차단: hosts 파일 차단 실패");
        return;
      }

      // 브라우저 재시작
      await browserManager.restartBrowsersForBlocking();

      // 상태 업데이트
      isBlockingEnabled = true;
      blockStats.totalBlocks++;
      blockStats.todayBlocks++;

      // 차단 히스토리 저장
      userSettings.blockHistory.push({
        action: "스케줄 차단 시작",
        timestamp: new Date().toISOString(),
        details: {
          schedule: userSettings.blockSchedule,
        },
      });
      saveUserSettings();

      log("INFO", "✅ 스케줄 차단 시작 완료");
    } catch (error) {
      log("ERROR", `스케줄 차단 시작 실패: ${error.message}`);
    }
  }
}

// 스케줄에 의한 차단 종료
async function stopScheduledBlocking() {
  if (isBlockingEnabled) {
    try {
      log("INFO", "🛑 스케줄 차단 종료");

      // hosts 파일 차단 해제
      const unblockSuccess = unblockWebsites();
      if (!unblockSuccess) {
        log("ERROR", "스케줄 차단 해제: hosts 파일 차단 해제 실패");
        return;
      }

      // 브라우저 새로고침
      await browserManager.refreshBrowsersForUnblocking();

      // 상태 업데이트
      isBlockingEnabled = false;

      // 차단 히스토리 저장
      userSettings.blockHistory.push({
        action: "스케줄 차단 종료",
        timestamp: new Date().toISOString(),
        details: {
          schedule: userSettings.blockSchedule,
        },
      });
      saveUserSettings();

      log("INFO", "✅ 스케줄 차단 종료 완료");
    } catch (error) {
      log("ERROR", `스케줄 차단 종료 실패: ${error.message}`);
    }
  }
}

// 서버 시작 시 설정 로드
loadUserSettings();

// 스케줄 체크 타이머 (1분마다 체크)
setInterval(() => {
  checkSchedule();
}, 60000); // 60초 = 1분

// 서버 시작 시 즉시 스케줄 체크
checkSchedule();

// ----- 브라우저 관리 시스템 -----
class BrowserManager {
  constructor() {
    this.supportedBrowsers = CONFIG.browsers.supported;
  }

  async getRunningBrowsers() {
    const runningBrowsers = [];
    const browserConfigs = [
      {
        name: "Google Chrome",
        process: "Google Chrome",
        appName: "Google Chrome",
      },
      {
        name: "Safari",
        process: "Safari.app/Contents/MacOS/Safari",
        appName: "Safari",
      },
      { name: "Firefox", process: "firefox", appName: "Firefox" },
      { name: "Whale", process: "Whale", appName: "Whale" },
      {
        name: "Microsoft Edge",
        process: "Microsoft Edge",
        appName: "Microsoft Edge",
      },
    ];

    for (const config of browserConfigs) {
      try {
        await executeCommand(`pgrep -f '${config.process}'`);
        runningBrowsers.push(config);
      } catch (error) {
        // 브라우저가 실행 중이지 않음
      }
    }

    return runningBrowsers;
  }

  // 차단 시작 시: 브라우저 닫고 다시 열고 창 복구
  async restartBrowsersForBlocking() {
    try {
      const runningBrowsers = await this.getRunningBrowsers();

      if (runningBrowsers.length === 0) {
        log("INFO", "실행 중인 브라우저가 없습니다.");
        return;
      }

      log(
        "INFO",
        `차단 시작: 브라우저 재시작 중... (${runningBrowsers
          .map((b) => b.name)
          .join(", ")})`
      );

      // 1. 브라우저 세션 저장
      await this.saveBrowserSessions(runningBrowsers);

      // 2. 모든 브라우저 종료
      for (const browserConfig of runningBrowsers) {
        try {
          log("INFO", `${browserConfig.name} 종료 중...`);

          // 안전한 종료
          await executeCommand(
            `osascript -e 'tell application "${browserConfig.appName}" to quit'`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // 강제 종료 (여전히 실행 중인 경우)
          try {
            await executeCommand(`pgrep -f "${browserConfig.process}"`);
            await executeCommand(`pkill -f "${browserConfig.process}"`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            // 이미 종료된 경우 무시
          }

          log("INFO", `${browserConfig.name} 종료 완료`);
        } catch (error) {
          log("ERROR", `${browserConfig.name} 종료 중 오류: ${error.message}`);
        }
      }

      // 3. DNS 캐시 초기화
      await this.flushDNSCache();

      // 4. 브라우저 재시작
      for (const browserConfig of runningBrowsers) {
        try {
          log("INFO", `${browserConfig.name} 재시작 중...`);
          await executeCommand(`open -a "${browserConfig.appName}"`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          log("INFO", `${browserConfig.name} 재시작 완료`);
        } catch (error) {
          log(
            "ERROR",
            `${browserConfig.name} 재시작 중 오류: ${error.message}`
          );
        }
      }

      // 5. 브라우저 로딩 대기
      log("INFO", "브라우저 로딩 대기 중...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 6. 창 복구
      await this.restoreBrowserSessions(runningBrowsers);

      log("INFO", "차단 시작: 브라우저 재시작 및 창 복구 완료");
    } catch (error) {
      log("ERROR", `브라우저 재시작 중 오류: ${error.message}`);
    }
  }

  // 차단 해제 시: 브라우저 새로고침만
  async refreshBrowsersForUnblocking() {
    try {
      const runningBrowsers = await this.getRunningBrowsers();

      if (runningBrowsers.length === 0) {
        log("INFO", "실행 중인 브라우저가 없습니다.");
        return;
      }

      log(
        "INFO",
        `차단 해제: 브라우저 새로고침 중... (${runningBrowsers
          .map((b) => b.name)
          .join(", ")})`
      );

      // DNS 캐시 초기화
      await this.flushDNSCache();

      // 각 브라우저 새로고침만
      for (const browserConfig of runningBrowsers) {
        try {
          log("INFO", `${browserConfig.name} 새로고침 중...`);

          // 브라우저 활성화
          await executeCommand(
            `osascript -e 'tell application "${browserConfig.appName}" to activate'`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 새로고침 (Cmd+R)
          await executeCommand(
            "osascript -e 'tell application \"System Events\" to key code 15 using {command down}'"
          );

          log("INFO", `${browserConfig.name} 새로고침 완료`);
        } catch (error) {
          log(
            "ERROR",
            `${browserConfig.name} 새로고침 중 오류: ${error.message}`
          );
        }
      }

      log("INFO", "차단 해제: 브라우저 새로고침 완료");
    } catch (error) {
      log("ERROR", `브라우저 새로고침 중 오류: ${error.message}`);
    }
  }

  async saveBrowserSessions(runningBrowsers) {
    try {
      const sessionInfo = {
        runningBrowsers: runningBrowsers.map((b) => b.name),
        timestamp: new Date().toISOString(),
      };

      const sessionPath = path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        "focus_timer_sessions.json"
      );
      fs.writeFileSync(sessionPath, JSON.stringify(sessionInfo, null, 2));

      log(
        "INFO",
        `브라우저 세션 정보 저장 완료 (${runningBrowsers.length}개 브라우저)`
      );
    } catch (error) {
      log("ERROR", `세션 저장 중 오류: ${error.message}`);
    }
  }

  async restoreBrowserSessions(runningBrowsers) {
    try {
      log("INFO", "브라우저 창 복구 중...");

      for (const browserConfig of runningBrowsers) {
        try {
          // 브라우저 활성화
          await executeCommand(
            `osascript -e 'tell application "${browserConfig.appName}" to activate'`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 새 창 닫기 (Cmd+W) - 3번 반복
          for (let i = 0; i < 3; i++) {
            await executeCommand(
              "osascript -e 'tell application \"System Events\" to key code 13 using {command down}'"
            );
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // 브라우저 활성화 대기
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Cmd+Shift+T로 세션 복구
          await executeCommand(
            "osascript -e 'tell application \"System Events\" to key code 17 using {command down, shift down}'"
          );

          log("INFO", `${browserConfig.name} 창 복구 완료`);
        } catch (error) {
          log(
            "ERROR",
            `${browserConfig.name} 창 복구 중 오류: ${error.message}`
          );
        }
      }

      log("INFO", "브라우저 창 복구 완료");
    } catch (error) {
      log("ERROR", `브라우저 창 복구 중 오류: ${error.message}`);
    }
  }

  async flushDNSCache() {
    try {
      log("INFO", "DNS 캐시 초기화 중...");
      await executeCommand("sudo dscacheutil -flushcache");
      await executeCommand("sudo killall -HUP mDNSResponder");
      log("INFO", "DNS 캐시 초기화 완료");
    } catch (error) {
      log("ERROR", `DNS 캐시 초기화 중 오류: ${error.message}`);
    }
  }
}

// 브라우저 매니저 인스턴스 생성
const browserManager = new BrowserManager();

// ----- hosts 파일 관리 -----
function backupHosts() {
  try {
    const backupPath = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      "Library/Application Support/FocusTimer/hosts_backup"
    );
    if (!fs.existsSync(backupPath)) {
      // 디렉토리가 없으면 생성
      const dir = path.dirname(backupPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const hostsContent = fs.readFileSync(
        CONFIG.system_paths.hosts_file,
        "utf8"
      );
      fs.writeFileSync(backupPath, hostsContent);
      log("INFO", "hosts 파일 백업 완료");
    }
  } catch (error) {
    log("ERROR", `hosts 파일 백업 실패: ${error.message}`);
  }
}

function blockWebsites() {
  try {
    backupHosts();

    const lines = fs
      .readFileSync(CONFIG.system_paths.hosts_file, "utf8")
      .split("\n");

    // FocusTimer 블록 시작/끝 마커
    const blockStart = "# FocusTimer Block Start";
    const blockEnd = "# FocusTimer Block End";

    // 기존 블록 제거
    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(blockStart)) {
        startIdx = i;
      } else if (lines[i].includes(blockEnd)) {
        endIdx = i;
        break;
      }
    }

    if (startIdx !== -1 && endIdx !== -1) {
      lines.splice(startIdx, endIdx - startIdx + 1);
    }

    // 새로운 차단 설정 추가
    lines.push(blockStart);

    // 모든 카테고리의 웹사이트를 차단
    Object.values(CONFIG.blocked_websites).forEach((category) => {
      category.forEach((site) => {
        lines.push(`${CONFIG.system_paths.redirect_ip} ${site}`);
      });
    });

    lines.push(blockEnd);

    // 파일에 쓰기
    fs.writeFileSync(CONFIG.system_paths.hosts_file, lines.join("\n"));

    log("INFO", "hosts 파일 차단 설정 완료");
    return true;
  } catch (error) {
    log("ERROR", `hosts 파일 차단 실패: ${error.message}`);
    return false;
  }
}

function unblockWebsites() {
  try {
    const lines = fs
      .readFileSync(CONFIG.system_paths.hosts_file, "utf8")
      .split("\n");

    const blockStart = "# FocusTimer Block Start";
    const blockEnd = "# FocusTimer Block End";

    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(blockStart)) {
        startIdx = i;
      } else if (lines[i].includes(blockEnd)) {
        endIdx = i;
        break;
      }
    }

    if (startIdx !== -1 && endIdx !== -1) {
      lines.splice(startIdx, endIdx - startIdx + 1);
      fs.writeFileSync(CONFIG.system_paths.hosts_file, lines.join("\n"));
      log("INFO", "hosts 파일 차단 해제 완료");
      return true;
    }

    return false;
  } catch (error) {
    log("ERROR", `hosts 파일 차단 해제 실패: ${error.message}`);
    return false;
  }
}

// 코드 실행 및 검증 함수
function executeCode(code, testCases) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, "temp_solution.py");

    try {
      // 임시 파일에 코드 작성
      fs.writeFileSync(tempFile, code);

      let passedTests = 0;
      const results = [];

      // 각 테스트 케이스 실행
      const runTest = (index) => {
        if (index >= testCases.length) {
          // 모든 테스트 완료
          fs.unlinkSync(tempFile); // 임시 파일 삭제
          resolve({
            passed: passedTests,
            total: testCases.length,
            success: passedTests === testCases.length,
            results: results,
          });
          return;
        }

        const testCase = testCases[index];
        const command = `echo "${testCase.input}" | python3 ${tempFile}`;

        exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
          const output = stdout.trim();
          const isCorrect = output === testCase.output;

          results.push({
            input: testCase.input,
            expected: testCase.output,
            actual: output,
            passed: isCorrect,
            error: error ? error.message : null,
          });

          if (isCorrect) {
            passedTests++;
          }

          // 다음 테스트 케이스 실행
          runTest(index + 1);
        });
      };

      runTest(0);
    } catch (error) {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      reject(error);
    }
  });
}

// Python API를 통한 실제 알고리즘 문제 가져오기
function getRandomProblemFromAPI(difficulty = null) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: "text", // JSON 모드 대신 텍스트 모드 사용
      pythonPath: "python3",
      pythonOptions: ["-u"], // unbuffered output
      scriptPath: "./algorithm",
      args: ["--difficulty", difficulty || "RANDOM"],
    };

    PythonShell.run("get_random_problem.py", options, (err, results) => {
      if (err) {
        console.error("Python API 실행 오류:", err);
        // API 실패시 기본 문제 반환
        resolve(getDefaultProblem(difficulty));
        return;
      }

      if (results && results.length > 0) {
        try {
          // 결과를 JSON으로 파싱
          const problem = JSON.parse(results[0]);
          console.log(
            `API에서 문제 가져옴: ${problem.title} (${
              problem.platform || "Unknown"
            })`
          );
          resolve(problem);
        } catch (parseError) {
          console.error("JSON 파싱 오류:", parseError);
          console.error("원본 결과:", results[0]);
          resolve(getDefaultProblem(difficulty));
        }
      } else {
        resolve(getDefaultProblem(difficulty));
      }
    });
  });
}

// 기본 문제 반환 (API 실패시 사용)
function getDefaultProblem(difficulty = null) {
  const defaultProblems = [
    {
      id: "easy_001",
      title: "두 수의 합",
      description: "두 정수를 입력받아 합을 출력하는 프로그램을 작성하세요.",
      difficulty: "EASY",
      platform: "LOCAL",
      tags: ["ARRAY", "MATH"],
      testCases: [
        { input: "1 2", output: "3" },
        { input: "5 3", output: "8" },
        { input: "-1 1", output: "0" },
      ],
      solution: "a, b = map(int, input().split())\nprint(a + b)",
    },
    {
      id: "medium_001",
      title: "이진 탐색",
      description:
        "정렬된 배열에서 특정 값을 이진 탐색으로 찾는 프로그램을 작성하세요.",
      difficulty: "MEDIUM",
      platform: "LOCAL",
      tags: ["ARRAY", "BINARY_SEARCH"],
      testCases: [
        { input: "5 3\n1 2 3 4 5", output: "2" },
        { input: "5 6\n1 2 3 4 5", output: "-1" },
        { input: "3 1\n1 2 3", output: "0" },
      ],
      solution: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

n, target = map(int, input().split())
arr = list(map(int, input().split()))
print(binary_search(arr, target))`,
    },
  ];

  let availableProblems = defaultProblems;
  if (difficulty) {
    availableProblems = defaultProblems.filter(
      (p) => p.difficulty === difficulty
    );
  }

  if (availableProblems.length === 0) {
    availableProblems = defaultProblems;
  }

  const randomIndex = Math.floor(Math.random() * availableProblems.length);
  return availableProblems[randomIndex];
}

// 랜덤 문제 선택 함수 (API 우선 사용)
async function getRandomProblem(difficulty = null) {
  try {
    return await getRandomProblemFromAPI(difficulty);
  } catch (error) {
    console.error("API 호출 실패, 기본 문제 사용:", error);
    return getDefaultProblem(difficulty);
  }
}

// ----- API 라우트들 -----
app.get("/api/status", (req, res) => {
  res.json({
    isBlockingEnabled,
    blockStats,
    timestamp: new Date().toISOString(),
  });
});

// 차단 상태 확인 API (더 자세한 정보)
app.get("/api/block/status", (req, res) => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDay = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];

  res.json({
    success: true,
    isBlockingEnabled,
    isScheduleActive,
    blockStats,
    userSettings: {
      blockedSites: userSettings.blockedSites,
      blockSchedule: userSettings.blockSchedule,
    },
    currentInfo: {
      currentDay,
      currentTime,
    },
    message: isBlockingEnabled
      ? isScheduleActive
        ? "스케줄에 의한 차단이 활성화되어 있습니다."
        : "차단 시스템이 활성화되어 있습니다."
      : "차단 시스템이 비활성화되어 있습니다.",
  });
});

app.post("/api/block/start", async (req, res) => {
  try {
    log("INFO", "🚀 차단 시작 요청 받음");

    // 1. hosts 파일 차단
    log("INFO", "📝 hosts 파일 차단 설정 중...");
    const blockSuccess = blockWebsites();
    if (!blockSuccess) {
      return res.status(500).json({
        success: false,
        error: "hosts 파일 차단 실패",
      });
    }

    // 2. 브라우저 재시작 (닫고 다시 열고 창 복구)
    await browserManager.restartBrowsersForBlocking();

    // 상태 업데이트
    isBlockingEnabled = true;
    blockStats.totalBlocks++;
    blockStats.todayBlocks++;

    // 차단 히스토리 저장
    userSettings.blockHistory.push({
      action: "차단 시작",
      timestamp: new Date().toISOString(),
      details: {
        blockedSites: userSettings.blockedSites.length,
        schedule: userSettings.blockSchedule,
      },
    });
    saveUserSettings();

    log("INFO", "✅ 차단 시작 완료");
    res.json({
      success: true,
      message: "집중 모드 차단이 시작되었습니다.",
      blockStats,
    });
  } catch (error) {
    log("ERROR", `❌ 차단 시작 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/block/stop", async (req, res) => {
  try {
    log("INFO", "🛑 차단 중지 요청 받음");

    // 스케줄 활성화 중에는 차단 중지 불가
    if (isScheduleActive) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDay = ["일", "월", "화", "수", "목", "금", "토"][
        now.getDay()
      ];
      const { endTime } = userSettings.blockSchedule;

      return res.status(403).json({
        success: false,
        error: `스케줄 차단 시간 중입니다. ${currentDay} ${endTime}까지 차단이 유지됩니다.`,
        scheduleInfo: {
          currentDay,
          currentTime,
          endTime,
          isScheduleActive: true,
        },
      });
    }

    // 알고리즘 문제 풀이 검증이 필요한 경우
    const { code, problemId } = req.body;

    if (!code || !problemId) {
      // 문제 풀이 없이 요청한 경우, 랜덤 문제 제공
      const problem = getRandomProblem();
      return res.status(400).json({
        success: false,
        error: "차단 해제를 위해서는 알고리즘 문제를 풀어야 합니다.",
        requiresProblem: true,
        problem: {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          tags: problem.tags || [],
          testCases:
            problem.testCases && Array.isArray(problem.testCases)
              ? problem.testCases.map((tc) => ({
                  input: tc.input || tc.input_data || "",
                  output: tc.output || tc.expected_output || "",
                }))
              : [],
        },
      });
    }

    // 코드 실행 및 검증
    const problem = algorithmProblems.find((p) => p.id === problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: "문제를 찾을 수 없습니다.",
      });
    }

    const result = await executeCode(code, problem.testCases);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: `문제 풀이 실패! ${result.passed}/${result.total} 테스트 통과`,
        requiresProblem: true,
        problem: {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          tags: problem.tags || [],
          testCases:
            problem.testCases && Array.isArray(problem.testCases)
              ? problem.testCases.map((tc) => ({
                  input: tc.input || tc.input_data || "",
                  output: tc.output || tc.expected_output || "",
                }))
              : [],
        },
        testResults: result.results,
      });
    }

    // 문제 풀이 성공 - 차단 해제 진행
    log("INFO", "✅ 알고리즘 문제 풀이 성공 - 차단 해제 진행");

    // 1. hosts 파일 차단 해제
    log("INFO", "📝 hosts 파일 차단 해제 중...");
    const unblockSuccess = unblockWebsites();
    if (!unblockSuccess) {
      return res.status(500).json({
        success: false,
        error: "hosts 파일 차단 해제 실패",
      });
    }

    // 2. 브라우저 새로고침만 (종료/재시작 없음)
    await browserManager.refreshBrowsersForUnblocking();

    // 상태 업데이트
    isBlockingEnabled = false;

    // 차단 히스토리 저장
    userSettings.blockHistory.push({
      action: "차단 중지 (알고리즘 문제 풀이 성공)",
      timestamp: new Date().toISOString(),
      details: {
        duration: "알고리즘 문제 풀이 성공",
        problemSolved: problem.title,
        testResults: result,
      },
    });
    saveUserSettings();

    log("INFO", "✅ 차단 중지 완료");
    res.json({
      success: true,
      message: "알고리즘 문제 풀이 성공! 집중 모드 차단이 중지되었습니다.",
      blockStats,
      problemSolved: problem.title,
      testResults: result,
    });
  } catch (error) {
    log("ERROR", `❌ 차단 중지 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/block/sites", (req, res) => {
  const allSites = [];
  Object.entries(CONFIG.blocked_websites).forEach(([category, sites]) => {
    sites.forEach((site) => {
      allSites.push({
        domain: site,
        name: site.replace("www.", ""),
        category: category,
      });
    });
  });

  res.json({
    sites: allSites,
  });
});

// 사용자 설정 관련 API
app.get("/api/settings", (req, res) => {
  res.json({
    success: true,
    settings: userSettings,
  });
});

// 차단 사이트 설정 저장
app.post("/api/settings/blocked-sites", (req, res) => {
  try {
    const { blockedSites } = req.body;
    userSettings.blockedSites = blockedSites;
    saveUserSettings();

    log("INFO", `차단 사이트 설정 저장 완료 (${blockedSites.length}개 사이트)`);

    res.json({
      success: true,
      message: "차단 사이트 설정이 저장되었습니다.",
      settings: userSettings.blockedSites,
    });
  } catch (error) {
    log("ERROR", `차단 사이트 설정 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 차단 스케줄 설정 저장
app.post("/api/settings/block-schedule", async (req, res) => {
  try {
    const { startTime, endTime, days, code, problemId } = req.body;

    // 스케줄이 활성화된 상태에서 변경하려는 경우 알고리즘 문제 풀이 검증
    if (isScheduleActive) {
      if (!code || !problemId) {
        // 문제 풀이 없이 요청한 경우, 랜덤 문제 제공
        const problem = getRandomProblem();
        return res.status(400).json({
          success: false,
          error:
            "스케줄 차단 중에는 알고리즘 문제를 풀어야 스케줄을 변경할 수 있습니다.",
          requiresProblem: true,
          problem: {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            tags: problem.tags,
            testCases: problem.testCases.map((tc) => ({
              input: tc.input,
              output: tc.output,
            })),
          },
        });
      }

      // 코드 실행 및 검증
      const problem = algorithmProblems.find((p) => p.id === problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "문제를 찾을 수 없습니다.",
        });
      }

      const result = await executeCode(code, problem.testCases);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: `문제 풀이 실패! ${result.passed}/${result.total} 테스트 통과`,
          requiresProblem: true,
          problem: {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            tags: problem.tags || [],
            testCases:
              problem.testCases && Array.isArray(problem.testCases)
                ? problem.testCases.map((tc) => ({
                    input: tc.input || tc.input_data || "",
                    output: tc.output || tc.expected_output || "",
                  }))
                : [],
          },
          testResults: result.results,
        });
      }

      log("INFO", "✅ 스케줄 변경을 위한 알고리즘 문제 풀이 성공");
    }

    // 입력 검증
    if (!startTime || !endTime || !days || !Array.isArray(days)) {
      return res.status(400).json({
        success: false,
        error: "잘못된 입력입니다. startTime, endTime, days가 필요합니다.",
      });
    }

    // 시간 형식 검증 (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        error: "시간 형식이 올바르지 않습니다. HH:MM 형식을 사용하세요.",
      });
    }

    // 요일 검증
    const validDays = ["일", "월", "화", "수", "목", "금", "토"];
    if (!days.every((day) => validDays.includes(day))) {
      return res.status(400).json({
        success: false,
        error:
          "잘못된 요일입니다. 일, 월, 화, 수, 목, 금, 토 중에서 선택하세요.",
      });
    }

    // 스케줄 업데이트
    userSettings.blockSchedule = { startTime, endTime, days };
    saveUserSettings();

    log(
      "INFO",
      `스케줄 설정 저장: ${startTime} ~ ${endTime}, ${days.join(", ")}`
    );

    res.json({
      success: true,
      message: isScheduleActive
        ? "알고리즘 문제 풀이 성공! 차단 스케줄이 변경되었습니다."
        : "차단 스케줄이 저장되었습니다.",
      schedule: userSettings.blockSchedule,
      problemSolved: isScheduleActive ? problem?.title : null,
      testResults: isScheduleActive ? result : null,
    });
  } catch (error) {
    log("ERROR", `스케줄 설정 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 포모도로 설정 저장
app.post("/api/settings/pomodoro", (req, res) => {
  try {
    const { pomodoroSettings } = req.body;
    userSettings.pomodoroSettings = pomodoroSettings;
    saveUserSettings();

    log("INFO", "포모도로 설정 저장 완료");

    res.json({
      success: true,
      message: "포모도로 설정이 저장되었습니다.",
      settings: userSettings.pomodoroSettings,
    });
  } catch (error) {
    log("ERROR", `포모도로 설정 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 차단 히스토리 저장
app.post("/api/settings/block-history", (req, res) => {
  try {
    const { action, timestamp, details } = req.body;
    const historyEntry = {
      action,
      timestamp: timestamp || new Date().toISOString(),
      details,
    };

    userSettings.blockHistory.push(historyEntry);

    // 히스토리 최대 100개까지만 유지
    if (userSettings.blockHistory.length > 100) {
      userSettings.blockHistory = userSettings.blockHistory.slice(-100);
    }

    saveUserSettings();

    log("INFO", `차단 히스토리 저장 완료: ${action}`);

    res.json({
      success: true,
      message: "차단 히스토리가 저장되었습니다.",
      history: historyEntry,
    });
  } catch (error) {
    log("ERROR", `차단 히스토리 저장 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 차단 히스토리 조회
app.get("/api/settings/block-history", (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = userSettings.blockHistory.slice(-parseInt(limit)).reverse();

    res.json({
      success: true,
      history,
      total: userSettings.blockHistory.length,
    });
  } catch (error) {
    log("ERROR", `차단 히스토리 조회 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 설정 초기화
app.post("/api/settings/reset", (req, res) => {
  try {
    userSettings = {
      blockedSites: [],
      blockSchedule: {
        startTime: "09:00",
        endTime: "18:00",
        days: ["월", "화", "수", "목", "금"],
      },
      pomodoroSettings: {
        workTime: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      },
      blockHistory: [],
    };

    saveUserSettings();

    log("INFO", "사용자 설정 초기화 완료");

    res.json({
      success: true,
      message: "설정이 초기화되었습니다.",
      settings: userSettings,
    });
  } catch (error) {
    log("ERROR", `설정 초기화 실패: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 알고리즘 문제 관련 API
app.get("/api/algorithm/problems", (req, res) => {
  res.json({
    success: true,
    problems: algorithmProblems,
  });
});

app.get("/api/algorithm/problem/:id", (req, res) => {
  const problem = algorithmProblems.find((p) => p.id === req.params.id);
  if (problem) {
    res.json({
      success: true,
      problem,
    });
  } else {
    res.status(404).json({
      success: false,
      error: "문제를 찾을 수 없습니다.",
    });
  }
});

app.post("/api/algorithm/run-code", async (req, res) => {
  try {
    const { code, problemId } = req.body;
    const problem = algorithmProblems.find((p) => p.id === problemId);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: "문제를 찾을 수 없습니다.",
      });
    }

    const result = await executeCode(code, problem.testCases);
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    log("ERROR", `코드 실행 중 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/algorithm/random-problem", (req, res) => {
  const problem = getRandomProblem();
  res.json({
    success: true,
    problem,
  });
});

app.get("/api/algorithm/random-problem/:difficulty", (req, res) => {
  const problem = getRandomProblem(req.params.difficulty);
  res.json({
    success: true,
    problem,
  });
});

// 서버 시작
app.listen(PORT, "0.0.0.0", () => {
  log("INFO", `차단 서버가 포트 ${PORT}에서 실행 중입니다.`);
  log("INFO", `API 엔드포인트:`);
  log("INFO", `- GET  /api/status - 현재 상태 조회`);
  log("INFO", `- POST /api/block/start - 차단 시작`);
  log("INFO", `- POST /api/block/stop - 차단 중지`);
  log("INFO", `- GET  /api/block/sites - 차단 사이트 목록`);
  log("INFO", `설정 관리 API:`);
  log("INFO", `- GET  /api/settings - 전체 설정 조회`);
  log("INFO", `- POST /api/settings/blocked-sites - 차단 사이트 설정 저장`);
  log("INFO", `- POST /api/settings/block-schedule - 차단 스케줄 설정 저장`);
  log("INFO", `- POST /api/settings/pomodoro - 포모도로 설정 저장`);
  log("INFO", `- GET  /api/settings/block-history - 차단 히스토리 조회`);
  log("INFO", `- POST /api/settings/reset - 설정 초기화`);
  log("INFO", `알고리즘 문제 API:`);
  log("INFO", `- GET  /api/algorithm/problems - 모든 문제 목록`);
  log("INFO", `- GET  /api/algorithm/problem/:id - 특정 문제 조회`);
  log("INFO", `- POST /api/algorithm/run-code - 코드 실행 및 검증`);
  log("INFO", `- GET  /api/algorithm/random-problem - 랜덤 문제 조회`);
  log(
    "INFO",
    `- GET  /api/algorithm/random-problem/:difficulty - 난이도별 랜덤 문제 조회`
  );
});

module.exports = app;
