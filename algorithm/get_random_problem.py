#!/usr/bin/env python3
"""
Node.js에서 호출할 수 있는 알고리즘 문제 제공 스크립트
"""

import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict

# 현재 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from problem_data_structures import (
        AlgorithmProblem,
        ProblemDifficulty,
        ProblemPlatform,
        ProblemTag,
        ProblemTestCase,
    )
    from remote_problem_provider import RemoteProblemManager
except ImportError as e:
    print(f"모듈 import 오류: {e}", file=sys.stderr)
    sys.exit(1)


def generate_default_test_cases(problem) -> List[Dict[str, str]]:
    """문제 제목과 태그에 따라 기본 테스트 케이스 생성"""
    test_cases = []

    # 문제 제목에서 키워드 추출
    title_lower = problem.title.lower()

    # 태그 기반 테스트 케이스 생성
    tags = {tag.name for tag in problem.tags}

    # 전화번호 조합 문제
    if any(word in title_lower for word in ["phone", "letter", "combination", "digit"]):
        test_cases = [
            {"input": "23", "output": '["ad","ae","af","bd","be","bf","cd","ce","cf"]'},
            {"input": "", "output": "[]"},
            {"input": "2", "output": '["a","b","c"]'},
            {"input": "9", "output": '["w","x","y","z"]'},
        ]

    # 로마 숫자 변환 문제
    elif any(word in title_lower for word in ["roman", "integer", "numeral"]):
        test_cases = [
            {"input": "III", "output": "3"},
            {"input": "LVIII", "output": "58"},
            {"input": "MCMXCIV", "output": "1994"},
            {"input": "I", "output": "1"},
        ]

    # 두 수의 합 문제
    elif any(word in title_lower for word in ["sum", "add", "two", "numbers"]):
        test_cases = [
            {"input": "2 7 11 15\n9", "output": "[0,1]"},
            {"input": "3 2 4\n6", "output": "[1,2]"},
            {"input": "3 3\n6", "output": "[0,1]"},
            {"input": "1 2 3 4 5\n9", "output": "[3,4]"},
        ]

    # 수학 관련 문제
    elif ProblemTag.MATH in problem.tags or any(
        word in title_lower for word in ["sum", "add", "plus", "math"]
    ):
        test_cases = [
            {"input": "1 2", "output": "3"},
            {"input": "5 3", "output": "8"},
            {"input": "-1 1", "output": "0"},
            {"input": "100 200", "output": "300"},
        ]

    # 배열 관련 문제
    elif ProblemTag.ARRAY in problem.tags or any(
        word in title_lower for word in ["array", "list", "sequence"]
    ):
        test_cases = [
            {"input": "3\n1 2 3", "output": "6"},
            {"input": "5\n5 2 8 1 9", "output": "25"},
            {"input": "1\n42", "output": "42"},
            {"input": "4\n-1 -2 -3 -4", "output": "-10"},
        ]

    # 문자열 관련 문제
    elif ProblemTag.STRING in problem.tags or any(
        word in title_lower for word in ["string", "text", "word", "reverse"]
    ):
        test_cases = [
            {"input": "hello", "output": "olleh"},
            {"input": "algorithm", "output": "mhtirogla"},
            {"input": "a", "output": "a"},
            {"input": "racecar", "output": "racecar"},
        ]

    # 이진 탐색 관련 문제
    elif ProblemTag.BINARY_SEARCH in problem.tags or any(
        word in title_lower for word in ["binary", "search", "find"]
    ):
        test_cases = [
            {"input": "5 3\n1 2 3 4 5", "output": "2"},
            {"input": "5 6\n1 2 3 4 5", "output": "-1"},
            {"input": "3 1\n1 2 3", "output": "0"},
            {"input": "4 4\n1 2 3 4", "output": "3"},
        ]

    # 동적 프로그래밍 관련 문제
    elif ProblemTag.DYNAMIC_PROGRAMMING in problem.tags or any(
        word in title_lower for word in ["dp", "dynamic", "fibonacci"]
    ):
        test_cases = [
            {"input": "5", "output": "5"},
            {"input": "10", "output": "55"},
            {"input": "20", "output": "6765"},
            {"input": "1", "output": "1"},
        ]

    # 해시 테이블 관련 문제
    elif ProblemTag.HASH_TABLE in problem.tags or any(
        word in title_lower for word in ["hash", "map", "dictionary"]
    ):
        test_cases = [
            {"input": "3\n1 2 3\n2", "output": "1"},
            {"input": "5\n5 2 8 1 9\n8", "output": "2"},
            {"input": "1\n42\n42", "output": "0"},
            {"input": "4\n1 2 3 4\n5", "output": "-1"},
        ]

    # 백트래킹 관련 문제
    elif ProblemTag.BACKTRACKING in problem.tags or any(
        word in title_lower for word in ["backtrack", "combination", "permutation"]
    ):
        test_cases = [
            {"input": "3", "output": "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"},
            {"input": "1", "output": "[[1]]"},
            {"input": "2", "output": "[[1,2],[2,1]]"},
            {"input": "0", "output": "[]"},
        ]

    # 기본 테스트 케이스 (어떤 태그도 매칭되지 않는 경우)
    else:
        test_cases = [
            {"input": "test", "output": "result"},
            {"input": "sample", "output": "output"},
            {"input": "input", "output": "expected"},
        ]

    return test_cases


def get_random_problem(difficulty=None):
    """API에서 실제 알고리즘 문제 가져오기"""
    try:
        # 원격 문제 관리자 초기화
        remote_manager = RemoteProblemManager()

        # 지원되는 플랫폼들
        supported_platforms = [
            ProblemPlatform.LEETCODE,
            ProblemPlatform.CODEFORCES,
            ProblemPlatform.BOJ,
        ]

        all_problems = []

        # 각 플랫폼에서 문제 가져오기
        for platform in supported_platforms:
            try:
                # 플랫폼별로 최대 20개 문제씩 가져오기
                platform_problems = remote_manager.get_all_problems(platform, limit=20)
                all_problems.extend(platform_problems)
                print(
                    f"{platform.name}에서 {len(platform_problems)}개 문제 로드",
                    file=sys.stderr,
                )
            except Exception as e:
                print(f"{platform.name} 문제 로드 실패: {e}", file=sys.stderr)
                continue

        if not all_problems:
            print("API에서 문제를 가져올 수 없어 기본 문제 사용", file=sys.stderr)
            return create_default_problem(difficulty)

        # 난이도 필터링
        if difficulty and difficulty != "RANDOM":
            try:
                target_difficulty = ProblemDifficulty[difficulty]
                filtered_problems = [
                    p for p in all_problems if p.difficulty == target_difficulty
                ]
                if filtered_problems:
                    all_problems = filtered_problems
                    print(
                        f"난이도 {difficulty} 필터링: {len(filtered_problems)}개 문제",
                        file=sys.stderr,
                    )
            except KeyError:
                pass  # 잘못된 난이도면 전체 문제에서 선택

        # 랜덤 선택
        import random

        selected_problem = random.choice(all_problems)

        print(
            f"선택된 문제: {selected_problem.title} ({selected_problem.platform.name})",
            file=sys.stderr,
        )

        # 테스트 케이스가 없으면 기본 테스트 케이스 생성
        if not selected_problem.test_cases:
            # 문제 제목과 태그에 따라 기본 테스트 케이스 생성
            default_test_cases = generate_default_test_cases(selected_problem)
        else:
            default_test_cases = [
                {"input": tc.input_data, "output": tc.expected_output}
                for tc in selected_problem.test_cases
            ]

        # JSON 직렬화 가능한 형태로 변환
        return {
            "id": selected_problem.id,
            "title": selected_problem.title,
            "description": selected_problem.description,
            "difficulty": selected_problem.difficulty.name,
            "platform": selected_problem.platform.name,
            "tags": [tag.name for tag in selected_problem.tags],
            "testCases": default_test_cases,
            "solution": f"# {selected_problem.title}\n# {selected_problem.description}\n# 플랫폼: {selected_problem.platform.name}\n\n# 여기에 코드를 작성하세요",
            "platformUrl": selected_problem.platform_url,
        }

    except Exception as e:
        print(f"API 문제 생성 오류: {e}", file=sys.stderr)
        return create_default_problem(difficulty)


def create_default_problem(difficulty=None):
    """기본 문제 생성"""
    default_problems = [
        {
            "id": "easy_001",
            "title": "두 수의 합",
            "description": "두 정수를 입력받아 합을 출력하는 프로그램을 작성하세요.",
            "difficulty": "EASY",
            "tags": ["ARRAY", "MATH"],
            "testCases": [
                {"input": "1 2", "output": "3"},
                {"input": "5 3", "output": "8"},
                {"input": "-1 1", "output": "0"},
            ],
            "solution": "a, b = map(int, input().split())\nprint(a + b)",
        },
        {
            "id": "medium_001",
            "title": "이진 탐색",
            "description": "정렬된 배열에서 특정 값을 이진 탐색으로 찾는 프로그램을 작성하세요.",
            "difficulty": "MEDIUM",
            "tags": ["ARRAY", "BINARY_SEARCH"],
            "testCases": [
                {"input": "5 3\n1 2 3 4 5", "output": "2"},
                {"input": "5 6\n1 2 3 4 5", "output": "-1"},
                {"input": "3 1\n1 2 3", "output": "0"},
            ],
            "solution": """def binary_search(arr, target):
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
print(binary_search(arr, target))""",
        },
        {
            "id": "hard_001",
            "title": "피보나치 수열",
            "description": "피보나치 수열의 n번째 항을 동적 프로그래밍으로 계산하는 프로그램을 작성하세요.",
            "difficulty": "HARD",
            "tags": ["DYNAMIC_PROGRAMMING", "MATH"],
            "testCases": [
                {"input": "5", "output": "5"},
                {"input": "10", "output": "55"},
                {"input": "20", "output": "6765"},
            ],
            "solution": """def fibonacci(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]

n = int(input())
print(fibonacci(n))""",
        },
    ]

    if difficulty and difficulty != "RANDOM":
        filtered = [p for p in default_problems if p["difficulty"] == difficulty]
        if filtered:
            return filtered[0]

    import random

    return random.choice(default_problems)


def main():
    parser = argparse.ArgumentParser(description="알고리즘 문제 제공 스크립트")
    parser.add_argument(
        "--difficulty",
        default="RANDOM",
        choices=["EASY", "MEDIUM", "HARD", "RANDOM"],
        help="문제 난이도",
    )

    args = parser.parse_args()

    try:
        problem = get_random_problem(args.difficulty)
        print(json.dumps(problem, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"오류 발생: {e}", file=sys.stderr)
        # 오류 발생시 기본 문제 반환
        default_problem = create_default_problem(args.difficulty)
        print(json.dumps(default_problem, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
