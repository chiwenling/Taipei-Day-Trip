from fastapi import *
from fastapi.responses import FileResponse
import mysql.connector
from fastapi import FastAPI, Request, Form, Query, HTTPException
import json

app=FastAPI()
travel_db = mysql.connector.connect(
	host="localhost",
	user="root",
	password="leeminho",
	database="travel"
)
print(travel_db)
cursor=travel_db.cursor()


# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")

@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")

@app.get("/api/attractions")
async def searchAttraction(request: Request,page:int = Query(0), keyword: str = Query("")):
	try:
		cursor = travel_db.cursor(dictionary=True)
		page_size=12
		offset = page * page_size
		if 	keyword:
			cursor.execute("SELECT COUNT(*) AS total FROM attractions WHERE mrt=%s OR name LIKE %s",(keyword,f"%{keyword}%"))
			total_num= cursor.fetchone() 
			print(total_num)
			
			#因為回傳值是{'total': x}
			total= total_num["total"]
			print(total)
			offset = total//12 * page_size
			
			cursor.execute("SELECT id, name, category, description, address, transport, mrt, lat, lng, images\
							FROM attractions\
							WHERE MRT = %s OR name LIKE %s\
							LIMIT %s OFFSET %s",(keyword,f"%{keyword}%",page_size,offset))
			attractions=cursor.fetchall()
			
	
		else:
			cursor.execute("SELECT id, name, category, description, address, transport, mrt, lat, lng, images\
							FROM attractions\
				  			LIMIT %s OFFSET %s",(page_size,offset))
			attractions=cursor.fetchall()

			cursor.execute("SELECT COUNT(*) AS total FROM attractions")
			total= cursor.fetchone()
			total= total["total"]

		for attraction in attractions:
			if 'images' in attraction and attraction['images']:
					images_str = attraction['images']
					attraction['images'] = [img.strip() for img in images_str.split(',')]

		if 	attractions ==  None:
			return {"data": None}
		
		else:
			next_page = page + 1 if (page + 1) * page_size < total else None
			return {
				"nextPage": next_page,
				"data": attractions
			}	

	except:
		   raise HTTPException(status_code=500, detail={"error": True, "message": "請按照情境提供對應的錯誤訊息"})

#只會有一筆
@app.get("/api/attraction/{attractionId}")
async def searchId(request: Request, attractionId:int):
	try:
		cursor = travel_db.cursor(dictionary=True)
		cursor.execute("SELECT * FROM attractions WHERE id=%s",(attractionId,))
		attraction=cursor.fetchone()
		
		if 'images' in attraction and attraction['images']:
				images_str = attraction['images']
				attraction['images'] = [img.strip() for img in images_str.split(',')]
		if attraction:
			return{
				"data": attraction
			}
		else: 
			raise HTTPException(status_code=400, detail={"error": True, "message": "請按照情境提供對應的錯誤訊息"})
	except Exception as err:
           raise HTTPException(status_code=500, detail={"error": True, "message": "請按照情境提供對應的錯誤訊息"})
    
@app.get("/api/mrts")
async def searchMrt(request: Request):
	try:
		cursor = travel_db.cursor(dictionary=True)
		cursor.execute("SELECT MRT FROM attractions GROUP BY MRT ORDER BY COUNT(*)DESC")
		mrt_data=cursor.fetchall()
		
		mrt=[]
		for station in mrt_data:
			if station["MRT"] is not None:
				mrt.append(station["MRT"])
		return{"data":mrt}
		
	except Exception as err:
           raise HTTPException(status_code=500, detail={"error": True, "message": "請按照情境提供對應的錯誤訊息"})

@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
 
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")