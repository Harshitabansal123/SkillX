import csv
import json
import os

# Change this to wherever your CSV folder is
CSV_FOLDER = r"C:\Users\harsh\Downloads\leetcode-company-wise-problems-2022-main\leetcode-company-wise-problems-2022-main\companies"

COMPANIES = [
    "Amazon", "Google", "Microsoft", "Adobe", "Facebook",
    "Apple", "Uber", "Netflix", "Goldman Sachs", "Bloomberg",
    "Oracle", "Salesforce", "Walmart", "Morgan Stanley"
]

COMPANY_EMOJIS = {
    "Amazon": "📦", "Google": "🔍", "Microsoft": "🪟",
    "Adobe": "🎨", "Facebook": "👥", "Apple": "🍎",
    "Uber": "🚗", "Netflix": "🎬", "Goldman Sachs": "💰",
    "Bloomberg": "📊", "Oracle": "🗄️", "Salesforce": "☁️",
    "Walmart": "🏪", "Morgan Stanley": "🏦"
}

def guess_topic(name):
    name_lower = name.lower()
    if any(w in name_lower for w in ["tree","binary","bst","trie","traversal"]): return "Trees"
    if any(w in name_lower for w in ["graph","island","path","network","clone"]): return "Graphs"
    if any(w in name_lower for w in ["subsequence","knapsack","coin","jump","partition"]): return "Dynamic Programming"
    if any(w in name_lower for w in ["string","palindrome","anagram","substring","char"]): return "Strings"
    if any(w in name_lower for w in ["linked","node","reverse list","merge list"]): return "Linked List"
    if any(w in name_lower for w in ["stack","queue","bracket","parenthes","valid"]): return "Stack/Queue"
    if any(w in name_lower for w in ["search","sort","merge","binary search","kth"]): return "Sorting/Searching"
    if any(w in name_lower for w in ["matrix","grid","spiral","rotate"]): return "Matrix"
    if any(w in name_lower for w in ["heap","priority","top k","median"]): return "Heap"
    return "Arrays"

def guess_difficulty(num_occur):
    try:
        n = int(num_occur)
        if n >= 15: return "Medium"
        if n >= 5:  return "Easy"
        return "Hard"
    except:
        return "Medium"

def get_frequency(num_occur):
    try:
        n = int(num_occur)
        if n >= 20: return "Very High"
        if n >= 10: return "High"
        if n >= 5:  return "Medium"
        return "Low"
    except:
        return "Medium"

result = {}

for company in COMPANIES:
    filepath = os.path.join(CSV_FOLDER, f"{company}.csv")
    
    if not os.path.exists(filepath):
        print(f"⚠️  Skipping {company} - not found at {filepath}")
        continue

    questions = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
        # Sort by frequency - most asked first
        rows.sort(
            key=lambda x: int(x.get('num_occur', 0)) if str(x.get('num_occur', '0')).isdigit() else 0,
            reverse=True
        )
        
        for i, row in enumerate(rows[:35]):
            title  = row.get('problem_name', '').strip()
            url    = row.get('problem_link', '').strip()
            occur  = row.get('num_occur', '1').strip()
            
            if not title or not url:
                continue
            
            questions.append({
                "id":              i + 1,
                "title":           title,
                "difficulty":      guess_difficulty(occur),
                "topic":           guess_topic(title),
                "leetcode_url":    url,
                "frequency":       get_frequency(occur),
                "num_occurrences": int(occur) if occur.isdigit() else 1,
                "round":           "Technical Interview",
                "year":            "2022-2024"
            })

    company_key = company.lower().replace(" ", "_")
    focus_topics = list(set(q["topic"] for q in questions[:15]))[:5]
    
    result[company_key] = {
        "info": {
            "full_name":        company,
            "logo_emoji":       COMPANY_EMOJIS.get(company, "🏢"),
            "rounds":           ["Online Assessment", "Technical Round 1",
                                 "Technical Round 2", "HR Round"],
            "focus_topics":     focus_topics,
            "difficulty_split": {
                "Easy":   len([q for q in questions if q["difficulty"] == "Easy"]),
                "Medium": len([q for q in questions if q["difficulty"] == "Medium"]),
                "Hard":   len([q for q in questions if q["difficulty"] == "Hard"])
            }
        },
        "questions": questions
    }
    print(f"✅ {company} — {len(questions)} questions added")

# Save inside backend/api folder
output_path = os.path.join(os.path.dirname(__file__), "api", "company_data_raw.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f"\n✅ Done! {len(result)} companies saved to backend/api/company_data_raw.json")