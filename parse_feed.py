import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

def parse_feed():
    url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
    try:
        response = urllib.request.urlopen(url)
        xml_data = response.read()
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return

    # Parse XML
    # Atom namespace
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return

    entries = []
    for entry in root.findall('atom:entry', namespaces):
        title = entry.find('atom:title', namespaces).text
        updated = entry.find('atom:updated', namespaces).text
        link_elem = entry.find('atom:link[@rel="alternate"]', namespaces)
        link = link_elem.attrib.get('href') if link_elem is not None else ''
        content_elem = entry.find('atom:content', namespaces)
        content_html = content_elem.text if content_elem is not None else ''

        # Parse HTML content to extract individual updates
        soup = BeautifulSoup(content_html, 'html.parser')
        
        # We want to identify individual updates.
        # Often structured as:
        # <h3>Type (Feature/Change/etc)</h3>
        # followed by <p>, <ul>, etc. until the next <h3>
        
        updates = []
        current_type = "Update"
        current_elements = []
        
        for child in soup.children:
            if child.name == 'h3':
                if current_elements:
                    updates.append({
                        'type': current_type,
                        'html': ''.join(str(e) for e in current_elements),
                        'text': ''.join(e.get_text() if hasattr(e, 'get_text') else str(e) for e in current_elements).strip()
                    })
                    current_elements = []
                current_type = child.get_text().strip()
            elif child.name is not None:
                current_elements.append(child)
                
        if current_elements:
            updates.append({
                'type': current_type,
                'html': ''.join(str(e) for e in current_elements),
                'text': ''.join(e.get_text() if hasattr(e, 'get_text') else str(e) for e in current_elements).strip()
            })

        entries.append({
            'title': title,
            'date': title, # Usually the title is the date in this feed
            'updated': updated,
            'link': link,
            'updates': updates
        })

    print(f"Parsed {len(entries)} entries.")
    if entries:
        print("\nFirst entry detail:")
        print(f"Title: {entries[0]['title']}")
        print(f"Link: {entries[0]['link']}")
        print("Updates inside:")
        for idx, upd in enumerate(entries[0]['updates']):
            print(f"  [{idx}] Type: {upd['type']}")
            print(f"      Text summary (first 100 chars): {upd['text'][:100]}...")
            print(f"      HTML snippet: {upd['html'][:150]}...")

if __name__ == '__main__':
    parse_feed()
