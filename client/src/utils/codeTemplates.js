export const LANGUAGES = [
  { value: "python", label: "python", monaco: "python" },
  { value: "javascript", label: "javascript", monaco: "javascript" },
  { value: "typescript", label: "typescript", monaco: "typescript" },
  { value: "cpp", label: "c++", monaco: "cpp" },
  { value: "java", label: "java", monaco: "java" },
  { value: "go", label: "go", monaco: "go" },
];

export const STARTER_CODE = {
  python: `def solution(nums):
    # write your solution here
    pass


if __name__ == "__main__":
    print(solution([1, 2, 3]))
`,
  javascript: `function solution(nums) {
  // write your solution here
}

console.log(solution([1, 2, 3]));
`,
  typescript: `function solution(nums: number[]): unknown {
  // write your solution here
  return null;
}

console.log(solution([1, 2, 3]));
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int solution(vector<int>& nums) {
    // write your solution here
    return 0;
}

int main() {
    vector<int> nums = {1, 2, 3};
    cout << solution(nums) << endl;
}
`,
  java: `import java.util.*;

public class Solution {
    public static int solution(int[] nums) {
        // write your solution here
        return 0;
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        System.out.println(solution(nums));
    }
}
`,
  go: `package main

import "fmt"

func solution(nums []int) int {
    // write your solution here
    return 0
}

func main() {
    fmt.Println(solution([]int{1, 2, 3}))
}
`,
};

const COLOR_PALETTE = [
  "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80",
  "#34d399", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6",
];

export function colorForUser(userId) {
  if (!userId) return COLOR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}
