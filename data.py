# 將json的資料匯進去資料庫，把不是jpg和png的圖片過濾到，其他都要放進去資料庫


import json
import mysql.connector


with open("data/taipei-attractions.json", "r" ,encoding="utf-8") as file:
    data=json.load(file)
    results = data["result"]["results"]

def filter_urls(urls):
    return [url for url in urls if url.lower().endswith(('.jpg','.png'))]

def split_urls(url_string):
    if not url_string:
        return []
    
    urls = []
    parts = url_string.split('http')
    
    for part in parts:
        if  part: 
            urls.append('http' + part)
    return urls


travel_db = mysql.connector.connect(
  host="localhost",
  user="root",
  password="leeminho",
  database="travel"
)

cursor = travel_db.cursor()

cursor.execute("""CREATE TABLE attractions(
    id INT PRIMARY KEY auto_increment,
    name VARCHAR(255),
    category VARCHAR(255),
    description TEXT,
    address VARCHAR(255),
    transport TEXT,
    MRT VARCHAR(255),
    lat DOUBLE,
    lng DOUBLE,
    images TEXT,
    open_time TEXT,
    rate DOUBLE,
    SERIAL_NO VARCHAR(255))
""")


sql = """INSERT INTO attractions (name, category, description, address, transport, mrt, lat, lng, images, open_time, rate, SERIAL_NO)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""

for attraction in results:
    # print(attraction) 
    url_string = attraction['file'] if 'file' in attraction else ''

    urls = split_urls(url_string)
    valid_urls= filter_urls(urls)
    image_string = ', '.join(valid_urls) 

    values = (
        attraction["name"], attraction["CAT"], attraction["description"], attraction["address"], 
        attraction["direction"], attraction["MRT"], attraction["latitude"], attraction["longitude"],
        image_string, attraction["MEMO_TIME"], attraction["rate"], attraction["SERIAL_NO"]
    )
    cursor.execute(sql, values)

travel_db.commit()

cursor.close()
travel_db.close()
