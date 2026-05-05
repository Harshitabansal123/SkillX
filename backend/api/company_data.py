# backend/api/company_data.py

COMPANY_QUESTIONS = [

# ================= GOOGLE =================
{
"id": "google",
"info": {
    "full_name": "Google",
    "focus_topics": ["Arrays","DP","Graphs","Trees"],
    "difficulty_split": {"easy":20,"medium":50,"hard":30},
    "rounds": ["Online Assessment","Phone Screen","Onsite"]
},
"questions": [
{"id":1,"title":"Two Sum","difficulty":"Easy","topic":"Arrays","link":"https://leetcode.com/problems/two-sum/"},
{"id":2,"title":"Longest Substring Without Repeating Characters","difficulty":"Medium","topic":"Strings","link":"https://leetcode.com/problems/longest-substring-without-repeating-characters/"},
{"id":3,"title":"Median of Two Sorted Arrays","difficulty":"Hard","topic":"Binary Search","link":"https://leetcode.com/problems/median-of-two-sorted-arrays/"},
{"id":4,"title":"3Sum","difficulty":"Medium","topic":"Arrays","link":"https://leetcode.com/problems/3sum/"},
{"id":5,"title":"Container With Most Water","difficulty":"Medium","topic":"Two Pointers","link":"https://leetcode.com/problems/container-with-most-water/"},
{"id":6,"title":"Valid Parentheses","difficulty":"Easy","topic":"Stack","link":"https://leetcode.com/problems/valid-parentheses/"},
{"id":7,"title":"Merge Intervals","difficulty":"Medium","topic":"Intervals","link":"https://leetcode.com/problems/merge-intervals/"},
{"id":8,"title":"Climbing Stairs","difficulty":"Easy","topic":"DP","link":"https://leetcode.com/problems/climbing-stairs/"},
{"id":9,"title":"Word Ladder","difficulty":"Hard","topic":"Graphs","link":"https://leetcode.com/problems/word-ladder/"},
{"id":10,"title":"Number of Islands","difficulty":"Medium","topic":"Graphs","link":"https://leetcode.com/problems/number-of-islands/"},
{"id":11,"title":"Binary Tree Inorder Traversal","difficulty":"Easy","topic":"Trees","link":"https://leetcode.com/problems/binary-tree-inorder-traversal/"},
{"id":12,"title":"Lowest Common Ancestor of BST","difficulty":"Easy","topic":"Trees","link":"https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/"},
{"id":13,"title":"Kth Largest Element in Array","difficulty":"Medium","topic":"Heap","link":"https://leetcode.com/problems/kth-largest-element-in-an-array/"},
{"id":14,"title":"Longest Increasing Subsequence","difficulty":"Medium","topic":"DP","link":"https://leetcode.com/problems/longest-increasing-subsequence/"},
{"id":15,"title":"Trapping Rain Water","difficulty":"Hard","topic":"Two Pointers","link":"https://leetcode.com/problems/trapping-rain-water/"}
]
},

# ================= AMAZON =================
{
"id": "amazon",
"info": {
    "full_name": "Amazon",
    "focus_topics": ["Arrays","Trees","Design"],
    "difficulty_split": {"easy":25,"medium":55,"hard":20},
    "rounds": ["OA","Interviews"]
},
"questions": [
{"id":16,"title":"Two Sum","difficulty":"Easy","topic":"Arrays","link":"https://leetcode.com/problems/two-sum/"},
{"id":17,"title":"LRU Cache","difficulty":"Medium","topic":"Design","link":"https://leetcode.com/problems/lru-cache/"},
{"id":18,"title":"Word Ladder","difficulty":"Hard","topic":"Graphs","link":"https://leetcode.com/problems/word-ladder/"},
{"id":19,"title":"Product of Array Except Self","difficulty":"Medium","topic":"Arrays","link":"https://leetcode.com/problems/product-of-array-except-self/"},
{"id":20,"title":"Top K Frequent Elements","difficulty":"Medium","topic":"Heap","link":"https://leetcode.com/problems/top-k-frequent-elements/"},
{"id":21,"title":"Reorder List","difficulty":"Medium","topic":"Linked List","link":"https://leetcode.com/problems/reorder-list/"},
{"id":22,"title":"Course Schedule","difficulty":"Medium","topic":"Graphs","link":"https://leetcode.com/problems/course-schedule/"},
{"id":23,"title":"Min Stack","difficulty":"Easy","topic":"Stack","link":"https://leetcode.com/problems/min-stack/"},
{"id":24,"title":"Search in Rotated Sorted Array","difficulty":"Medium","topic":"Binary Search","link":"https://leetcode.com/problems/search-in-rotated-sorted-array/"},
{"id":25,"title":"Longest Palindromic Substring","difficulty":"Medium","topic":"Strings","link":"https://leetcode.com/problems/longest-palindromic-substring/"},
{"id":26,"title":"Sliding Window Maximum","difficulty":"Hard","topic":"Deque","link":"https://leetcode.com/problems/sliding-window-maximum/"},
{"id":27,"title":"Serialize and Deserialize Binary Tree","difficulty":"Hard","topic":"Trees","link":"https://leetcode.com/problems/serialize-and-deserialize-binary-tree/"},
{"id":28,"title":"Group Anagrams","difficulty":"Medium","topic":"HashMap","link":"https://leetcode.com/problems/group-anagrams/"},
{"id":29,"title":"Valid Sudoku","difficulty":"Medium","topic":"Matrix","link":"https://leetcode.com/problems/valid-sudoku/"},
{"id":30,"title":"Meeting Rooms II","difficulty":"Medium","topic":"Intervals","link":"https://leetcode.com/problems/meeting-rooms-ii/"}
]
},

# ================= MICROSOFT =================
{
"id": "microsoft",
"info": {
    "full_name": "Microsoft",
    "focus_topics": ["Trees","Graphs","DP"],
    "difficulty_split": {"easy":30,"medium":50,"hard":20},
    "rounds": ["OA","Interviews"]
},
"questions": [
{"id":31,"title":"Reverse Linked List","difficulty":"Easy","topic":"Linked List","link":"https://leetcode.com/problems/reverse-linked-list/"},
{"id":32,"title":"Number of Islands","difficulty":"Medium","topic":"Graphs","link":"https://leetcode.com/problems/number-of-islands/"},
{"id":33,"title":"Serialize and Deserialize Binary Tree","difficulty":"Hard","topic":"Trees","link":"https://leetcode.com/problems/serialize-and-deserialize-binary-tree/"},
{"id":34,"title":"Add Two Numbers","difficulty":"Medium","topic":"Linked List","link":"https://leetcode.com/problems/add-two-numbers/"},
{"id":35,"title":"Binary Tree Level Order Traversal","difficulty":"Medium","topic":"Trees","link":"https://leetcode.com/problems/binary-tree-level-order-traversal/"},
{"id":36,"title":"Word Break","difficulty":"Medium","topic":"DP","link":"https://leetcode.com/problems/word-break/"},
{"id":37,"title":"Spiral Matrix","difficulty":"Medium","topic":"Matrix","link":"https://leetcode.com/problems/spiral-matrix/"},
{"id":38,"title":"Set Matrix Zeroes","difficulty":"Medium","topic":"Matrix","link":"https://leetcode.com/problems/set-matrix-zeroes/"},
{"id":39,"title":"Clone Graph","difficulty":"Medium","topic":"Graphs","link":"https://leetcode.com/problems/clone-graph/"},
{"id":40,"title":"Path Sum","difficulty":"Easy","topic":"Trees","link":"https://leetcode.com/problems/path-sum/"},
{"id":41,"title":"Balanced Binary Tree","difficulty":"Easy","topic":"Trees","link":"https://leetcode.com/problems/balanced-binary-tree/"},
{"id":42,"title":"House Robber","difficulty":"Medium","topic":"DP","link":"https://leetcode.com/problems/house-robber/"},
{"id":43,"title":"Longest Common Subsequence","difficulty":"Medium","topic":"DP","link":"https://leetcode.com/problems/longest-common-subsequence/"},
{"id":44,"title":"Pow(x, n)","difficulty":"Medium","topic":"Math","link":"https://leetcode.com/problems/powx-n/"},
{"id":45,"title":"Maximum Product Subarray","difficulty":"Medium","topic":"DP","link":"https://leetcode.com/problems/maximum-product-subarray/"}
]
}

]
