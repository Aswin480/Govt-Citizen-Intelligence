import requests

url = "https://en.wikipedia.org/wiki/List_of_constituencies_of_the_Andhra_Pradesh_Legislative_Assembly"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    # Print the first 1000 characters to verify, or look for specific table headers
    print("Successfully fetched!")
    if "Members of Legislative Assembly" in response.text or "List of winners" in response.text or "Member" in response.text:
       print("Found potential member list.")
    
    # Save to a file for inspection (simulated) or just print a chunk
    # We'll just print a relevant section to stdout to capture it
    start_marker = '<table class="wikitable sortable'
    if start_marker in response.text:
        start_idx = response.text.find(start_marker)
        end_idx = response.text.find('</table>', start_idx)
        print(response.text[start_idx:end_idx+8][:2000]) # First 2000 chars of the table
    else:
        print("Could not find sortable wikitable.")

except Exception as e:
    print(f"Error: {e}")
