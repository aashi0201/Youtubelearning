/**
 * Lightweight Sandboxed Online Compiler Service
 * Zero side-effects: Executes code via isolated sandbox runners (Wandbox with Paiza fallback).
 * Makes 0 backend writes, 0 streak updates, and 0 user profile modifications.
 */

export const COMPILER_LANGUAGES = {
  cpp: {
    id: "cpp",
    label: "C++ (GCC 13.2)",
    wandboxCompiler: "gcc-13.2.0",
    paizaLang: "cpp",
    extension: "cpp",
    fileHeader: "// C++20 DSA Sandbox\n#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>\n\nusing namespace std;\n\n",
  },
  python: {
    id: "python",
    label: "Python (3.12)",
    wandboxCompiler: "cpython-3.12.7",
    paizaLang: "python3",
    extension: "py",
    fileHeader: "# Python 3.12 DSA Sandbox\nimport sys\nimport math\nfrom collections import defaultdict, deque\n\n",
  },
  java: {
    id: "java",
    label: "Java (OpenJDK 22)",
    wandboxCompiler: "openjdk-jdk-22+36",
    paizaLang: "java",
    extension: "java",
    fileHeader: "// Java 22 DSA Sandbox\nimport java.util.*;\nimport java.io.*;\n\n",
  },
  javascript: {
    id: "javascript",
    label: "JavaScript (Node 20)",
    wandboxCompiler: "nodejs-20.17.0",
    paizaLang: "javascript",
    extension: "js",
    fileHeader: "// JavaScript (Node.js 20) DSA Sandbox\nconst fs = require('fs');\n\n",
  },
};

export const DSA_TEMPLATES = {
  cpp: {
    twoSum: `// C++: Two Sum (Hash Map Approach - O(N))
#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    vector<int> result = twoSum(nums, target);
    if (!result.empty()) {
        cout << "Indices: [" << result[0] << ", " << result[1] << "]" << endl;
    } else {
        cout << "No solution found" << endl;
    }
    return 0;
}
`,
    binarySearch: `// C++: Binary Search on Sorted Array
#include <iostream>
#include <vector>

using namespace std;

int binarySearch(const vector<int>& arr, int target) {
    int left = 0, right = (int)arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19};
    int target = 11;
    int idx = binarySearch(arr, target);
    cout << "Target " << target << " found at index: " << idx << endl;
    return 0;
}
`,
    fastIO: `// C++: Custom Input Processing (Read from Stdin)
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) {
        cout << "Provide numbers in the Custom Input tab! Example: 5\\n10 40 20 50 30" << endl;
        return 0;
    }

    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    sort(a.begin(), a.end());

    cout << "Sorted Array (" << n << " elements): ";
    for (int x : a) cout << x << " ";
    cout << endl;

    return 0;
}
`,
    blank: `// C++ Playground
#include <iostream>

using namespace std;

int main() {
    cout << "Hello, DSA World!" << endl;
    return 0;
}
`,
  },
  python: {
    twoSum: `# Python: Two Sum (Hash Map Approach - O(N))
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

if __name__ == "__main__":
    nums = [2, 7, 11, 15]
    target = 9
    result = two_sum(nums, target)
    print(f"Indices: {result}")
`,
    binarySearch: `# Python: Binary Search
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

if __name__ == "__main__":
    arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
    target = 23
    idx = binary_search(arr, target)
    print(f"Target {target} located at index: {idx}")
`,
    fastIO: `# Python: Read from Custom Input (Stdin)
import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        print("Provide numbers in the Custom Input tab! Example: 5 10 40 20 50 30")
        return
    
    nums = [int(x) for x in input_data]
    print(f"Total numbers read: {len(nums)}")
    print(f"Sum: {sum(nums)}")
    print(f"Max: {max(nums)}, Min: {min(nums)}")
    print(f"Sorted: {sorted(nums)}")

if __name__ == "__main__":
    main()
`,
    blank: `# Python Playground
print("Hello, DSA World!")
`,
  },
  java: {
    twoSum: `// Java: Two Sum Solution
import java.util.*;

class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{ map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] res = twoSum(nums, target);
        System.out.println("Indices: " + Arrays.toString(res));
    }
}
`,
    binarySearch: `// Java: Binary Search
import java.util.*;

class Main {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {2, 4, 6, 8, 10, 12, 14, 16};
        int target = 10;
        int idx = binarySearch(arr, target);
        System.out.println("Element " + target + " index: " + idx);
    }
}
`,
    fastIO: `// Java: Custom Input Scanner (Stdin)
import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) {
            System.out.println("Enter array in Custom Input tab: 5\\n10 40 20 50 30");
            return;
        }

        int n = sc.nextInt();
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < n && sc.hasNextInt(); i++) {
            list.add(sc.nextInt());
        }

        Collections.sort(list);
        System.out.println("Sorted: " + list);
    }
}
`,
    blank: `// Java Playground
class Main {
    public static void main(String[] args) {
        System.out.println("Hello, DSA World!");
    }
}
`,
  },
  javascript: {
    twoSum: `// JavaScript: Two Sum Solution
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

const nums = [2, 7, 11, 15];
const target = 9;
console.log("Indices:", twoSum(nums, target));
`,
    binarySearch: `// JavaScript: Binary Search
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const arr = [1, 4, 7, 12, 19, 25, 33, 48];
const target = 19;
console.log(\`Target \${target} index:\`, binarySearch(arr, target));
`,
    fastIO: `// JavaScript: Stdin Reader
const fs = require('fs');

try {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (!input) {
    console.log("Enter input in the Custom Input tab!");
  } else {
    const tokens = input.split(/\\s+/);
    console.log("Read Tokens:", tokens);
    const nums = tokens.map(Number).filter(n => !isNaN(n));
    if (nums.length) {
      console.log("Sum of numbers:", nums.reduce((a, b) => a + b, 0));
    }
  }
} catch (e) {
  console.log("Standard input empty or unavailable.");
}
`,
    blank: `// JavaScript Playground
console.log("Hello, DSA World!");
`,
  },
};

// Security and Guardrail Limits
export const LIMITS = {
  MAX_CODE_BYTES: 50 * 1024, // 50 KB
  MAX_STDIN_BYTES: 25 * 1024, // 25 KB
  MAX_OUTPUT_CHARS: 8000, // Truncate at 8k characters
  EXECUTION_TIMEOUT_MS: 10000, // 10 seconds max
  COOLDOWN_SECONDS: 3, // Rate limit: 3s between runs
};

/**
 * Execute code via Wandbox sandbox
 */
async function executeWandbox({ compiler, code, stdin, signal }) {
  const response = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      compiler,
      code,
      stdin: stdin || "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Wandbox HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const stdout = (data.program_output || "").trim();
  const stderr = (data.program_error || data.compiler_error || data.compiler_message || "").trim();
  const isSuccess = data.status === "0";

  return {
    success: isSuccess,
    exitCode: data.status !== undefined ? Number(data.status) : 0,
    stdout,
    stderr,
    raw: data,
  };
}

/**
 * Fallback executor via Paiza.io
 */
async function executePaiza({ language, code, stdin, signal }) {
  const createRes = await fetch("https://api.paiza.io/runners/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      source_code: code,
      language,
      input: stdin || "",
      api_key: "guest",
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Paiza create HTTP error: ${createRes.status}`);
  }

  const createData = await createRes.json();
  const runnerId = createData.id;

  // Poll for completion (up to 8 attempts, 1s interval)
  for (let i = 0; i < 8; i++) {
    if (signal.aborted) throw new Error("Execution aborted due to timeout");
    await new Promise((resolve) => setTimeout(resolve, 800));

    const detailsRes = await fetch(
      `https://api.paiza.io/runners/get_details?id=${runnerId}&api_key=guest`,
      { signal }
    );
    if (!detailsRes.ok) continue;

    const details = await detailsRes.json();
    if (details.status === "completed") {
      const stdout = (details.stdout || "").trim();
      const stderr = (details.stderr || details.build_stderr || "").trim();
      const isSuccess = details.result === "success" || details.exit_code === 0;

      return {
        success: isSuccess,
        exitCode: details.exit_code !== undefined ? details.exit_code : 0,
        stdout,
        stderr,
        raw: details,
      };
    }
  }

  throw new Error("Paiza execution did not complete within the polling window.");
}

/**
 * Main sandboxed execution entry point
 * Enforces size limits, timeouts, and orchestrates sandbox fallbacks.
 * ZERO DATABASE WRITES, ZERO STREAK IMPACTS.
 */
export async function runSandboxCode({ language = "cpp", code = "", stdin = "" }) {
  // 1. Guardrail: Code Size Limit
  if (code.length > LIMITS.MAX_CODE_BYTES) {
    return {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: `[Execution Rejected]: Code length (${Math.round(code.length / 1024)} KB) exceeds the safe maximum limit of ${LIMITS.MAX_CODE_BYTES / 1024} KB.`,
      executionTimeMs: 0,
    };
  }

  // 2. Guardrail: Stdin Size Limit
  if (stdin.length > LIMITS.MAX_STDIN_BYTES) {
    return {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: `[Execution Rejected]: Input size (${Math.round(stdin.length / 1024)} KB) exceeds the safe maximum limit of ${LIMITS.MAX_STDIN_BYTES / 1024} KB.`,
      executionTimeMs: 0,
    };
  }

  const langConfig = COMPILER_LANGUAGES[language] || COMPILER_LANGUAGES.cpp;
  const startTime = performance.now();

  // 3. Guardrail: Strict 10-Second Abort Controller Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, LIMITS.EXECUTION_TIMEOUT_MS);

  try {
    let result = null;

    // First attempt: Wandbox
    try {
      result = await executeWandbox({
        compiler: langConfig.wandboxCompiler,
        code,
        stdin,
        signal: controller.signal,
      });
    } catch (wandboxErr) {
      if (controller.signal.aborted) throw wandboxErr;
      // Fallback: Paiza.io
      console.warn("Wandbox runner failed, falling back to Paiza.io:", wandboxErr.message);
      result = await executePaiza({
        language: langConfig.paizaLang,
        code,
        stdin,
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // 4. Guardrail: Truncate output if too large
    let stdout = result.stdout || "";
    let stderr = result.stderr || "";

    if (stdout.length > LIMITS.MAX_OUTPUT_CHARS) {
      stdout = stdout.slice(0, LIMITS.MAX_OUTPUT_CHARS) + `\n\n... [Output truncated: exceeded ${LIMITS.MAX_OUTPUT_CHARS} characters]`;
    }
    if (stderr.length > LIMITS.MAX_OUTPUT_CHARS) {
      stderr = stderr.slice(0, LIMITS.MAX_OUTPUT_CHARS) + `\n\n... [Error log truncated: exceeded ${LIMITS.MAX_OUTPUT_CHARS} characters]`;
    }

    return {
      success: result.success,
      exitCode: result.exitCode,
      stdout,
      stderr,
      executionTimeMs,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    const isTimeout = controller.signal.aborted || err.name === "AbortError" || err.message?.includes("aborted");

    return {
      success: false,
      exitCode: isTimeout ? 124 : 1,
      stdout: "",
      stderr: isTimeout
        ? `[Execution Timeout]: The process exceeded the ${LIMITS.EXECUTION_TIMEOUT_MS / 1000}-second safety limit.\nPlease check your code for infinite loops (e.g., while(true)) or recursion depth.`
        : `[Execution Error]: ${err.message || "Failed to contact sandbox compiler servers. Please try again."}`,
      executionTimeMs,
    };
  }
}
