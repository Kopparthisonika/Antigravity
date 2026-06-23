import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache for feed data
FEED_CACHE = {
    'data': None,
    'last_updated': None
}

def parse_feed_xml():
    url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
    
    # Configure headers to look like a standard browser request
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    
    try:
        response = urllib.request.urlopen(req, timeout=15)
        xml_data = response.read()
    except Exception as e:
        print(f"Error fetching feed: {e}")
        raise e

    # Parse XML
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        print(f"Error parsing XML: {e}")
        raise e

    entries = []
    for entry_idx, entry in enumerate(root.findall('atom:entry', namespaces)):
        title = entry.find('atom:title', namespaces).text
        updated = entry.find('atom:updated', namespaces).text
        
        link_elem = entry.find('atom:link[@rel="alternate"]', namespaces)
        link = link_elem.attrib.get('href') if link_elem is not None else ''
        
        content_elem = entry.find('atom:content', namespaces)
        content_html = content_elem.text if content_elem is not None else ''

        # Parse HTML content
        soup = BeautifulSoup(content_html, 'html.parser')
        
        # Split HTML content by <h3> headers to segment individual updates
        updates = []
        current_type = "Update"
        current_elements = []
        
        # Iterate over child elements to group them under corresponding <h3>
        for child in soup.children:
            # We ignore navigablestrings that are just whitespace
            if child.name is None and str(child).strip() == '':
                continue
                
            if child.name == 'h3':
                # Save previous update if exists
                if current_elements:
                    html_content = ''.join(str(e) for e in current_elements)
                    text_content = BeautifulSoup(html_content, 'html.parser').get_text().strip()
                    
                    updates.append({
                        'id': f"up-{entry_idx}-{len(updates)}",
                        'type': current_type,
                        'html': html_content,
                        'text': text_content
                    })
                    current_elements = []
                current_type = child.get_text().strip()
            else:
                current_elements.append(child)
                
        # Append last segment
        if current_elements or not updates:
            html_content = ''.join(str(e) for e in current_elements) if current_elements else content_html
            text_content = BeautifulSoup(html_content, 'html.parser').get_text().strip()
            
            updates.append({
                'id': f"up-{entry_idx}-{len(updates)}",
                'type': current_type,
                'html': html_content,
                'text': text_content
            })

        entries.append({
            'id': f"entry-{entry_idx}",
            'title': title,
            'date': title, # Date is formatted as title in BigQuery feed (e.g. "June 22, 2026")
            'updated': updated,
            'link': link,
            'updates': updates
        })
        
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/feed')
def get_feed():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    # Simple in-memory cache logic (cache for 10 minutes)
    import datetime
    now = datetime.datetime.now()
    
    if (not FEED_CACHE['data'] or 
        force_refresh or 
        not FEED_CACHE['last_updated'] or 
        (now - FEED_CACHE['last_updated']).seconds > 600):
        
        try:
            FEED_CACHE['data'] = parse_feed_xml()
            FEED_CACHE['last_updated'] = now
        except Exception as e:
            return jsonify({
                'error': f'Failed to fetch release notes: {str(e)}'
            }), 500
            
    return jsonify({
        'last_updated': FEED_CACHE['last_updated'].strftime('%Y-%m-%d %H:%M:%S'),
        'entries': FEED_CACHE['data']
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
