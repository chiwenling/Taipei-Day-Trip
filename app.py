from fastapi import *
from fastapi.responses import FileResponse, RedirectResponse
import mysql.connector
from fastapi import FastAPI, Request, Form, Query, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
import jwt, json
from datetime import timedelta, timezone
import datetime
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from pydantic import BaseModel
import httpx
import uuid

travel_db = mysql.connector.connect(
	host="localhost",
	user="root",
	password="leeminho",
	database="travel"
)

print(travel_db)
cursor=travel_db.cursor(dictionary=True)


app=FastAPI()
SECRET_KEY = "10c7909683f7c4295eb9d63d83cd5ca8f24f4b3d4a51154030ec643a7e8b3663"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: int
    name: str
    email: str

class User(BaseModel):
    id: int
    name: str
    email: str


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/pics", StaticFiles(directory="pics"), name="pics")

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")


#註冊會員
@app.post("/api/user")
async def enroll(request:Request):
		try:
			data = await request.json()
			name=data.get("name")
			email=data.get("email")
			password=data.get("password")
			cursor = travel_db.cursor(dictionary=True)
			# print("data",data)
			# print("name",name)
			
			cursor.execute("SELECT COUNT(*) AS COUNT FROM member WHERE email = %s", (email,))
			result = cursor.fetchone()
			# print("result",result)
			# print("有沒有",result["COUNT"])
			if result["COUNT"] > 0:
				return{
					"error": True,
					"message": "此email已註冊帳號"
				}
			else: 
				cursor.execute("INSERT INTO member (name, email, password) VALUES (%s, %s, %s)",(name, email, password))
				travel_db.commit()
				# print("已存入")
				return {"ok": True}
			
									
		except mysql.connector.Error as err:
			return{
					"error": True,
					"message": "伺服器內部錯誤"
				}
		finally:
			if cursor:
				cursor.close()
	 

# 取得會員資料
def create_access_token(user_data):
    expiration_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(days=7)
    payload = {
        "data": {
            "id": user_data["id"],
            "name": user_data["name"],
            "email": user_data["email"]
        },
        "exp": expiration_time
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    # print(token)
    return token

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # print("前方回來的token",token)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_data = payload.get("data")
        # print(f"Decoded payload: {payload}")
        # print("user_date:",user_data)
        if  not user_data:
            # print("沒有這個人") 
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        return user_data
    except:
        return None

@app.get("/api/user/auth")
async def get_user_info(user_data: dict = Depends(get_current_user)):
	if  user_data:
		# print("要給前端的資料",user_data)
		return {"data": user_data}
	else:
		# print("還沒有登入")
		return{"data":None}


@app.put("/api/user/auth")
async def signin(request: Request):
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")
        cursor = travel_db.cursor(dictionary=True)
        # print("檢查前端回傳的東西")
        # print(email)
        # print(password)
        cursor.execute("SELECT id, email, password, name FROM member WHERE email=%s AND password=%s", (email, password))
        member = cursor.fetchone()
        # print(member)
        if member:
            member_info = {
                "id": member["id"],
                "name": member["name"],
                "email": member["email"]
            }
            token = create_access_token(member_info)
            return {"token": token}
        else:
            return {
                "error": True,
                "message": "登入資料有誤"
            }

    except mysql.connector.Error as err:
        return {
            "error": True,
            "message": "伺服器內部錯誤"
        }
    finally:
        if cursor:
            cursor.close()


@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")

@app.get("/api/attractions")
async def searchAttraction(request: Request,page:int = Query(0), keyword: str = Query("")):
	try:
		cursor = travel_db.cursor(dictionary=True)
		page_size=12
		offset = page * page_size
		# print(keyword)

		if 	keyword or page:
			cursor.execute("SELECT COUNT(*) AS total FROM attractions WHERE mrt=%s OR name LIKE %s",(keyword,f"%{keyword}%"))
			total_num= cursor.fetchone() 
			# print(total_num)
			#因為回傳值是{'total': x}
			total= total_num["total"]		
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

		next_page = page + 1 if (page + 1) * page_size < total else None
		if  page > total//12: 
			return {"data": None}
		else:
			return {
				"nextPage": next_page,
				"data": attractions
		}	
	    
	except:
		   raise HTTPException(status_code=500, detail={"error": True, "message": "內部有問題"})

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
			raise HTTPException(status_code=400, detail={"error": True, "message": "沒東西"})
	except Exception as err:
           raise HTTPException(status_code=500, detail={"error": True, "message": "連結失敗"})
    
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
           raise HTTPException(status_code=500, detail={"error": True, "message": "連結失敗"})


@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")

@app.get("/api/booking")
async def bookingData(request:Request,user_data: dict = Depends(get_current_user)):
	member = user_data["email"]
	if  user_data:
		cursor.execute("SELECT * FROM booking WHERE bookingEmail = %s", (member,))
		result=cursor.fetchone()
		if result:
			attractionId=result["attractionId"]
			cursor.execute("SELECT id, name, address,images FROM attractions WHERE id=%s",(attractionId,))
			attractionInfo=cursor.fetchone()
			bookDetail={
				"attraction":{
					"id":attractionInfo["id"],
					"name":attractionInfo["name"],
					"address":attractionInfo["address"],
					"image":attractionInfo["images"].split(",")[0]
				},
				"date":result["date"],
				"time":result["time"],
				"price":result["price"]
			}
			if bookDetail:
				# print("資料回傳檢查",bookDetail)
				return {"data": bookDetail}
			else:
				return {"data": None}
		else:
			return {"data": None}
	else:	
		return {
			"error": True,
			"message": "請先進行登入再查看預定行程"
			}

 
@app.post("/api/booking")
async def booking(request:Request,user_data: dict = Depends(get_current_user)):
	member = user_data["email"]
	# print("這是會員帳號",member)
	data = await request.json()
	# print("這是訂購資料",data) 
	attractionId=data["attractionId"]
	date=data["date"]
	time=data["time"]
	price=data["price"]

	if 	not data["date"]:
		return {"error": True,"message": "請先選擇日期"}
	
	try:
		if  user_data: 
			cursor.execute("SELECT * from booking WHERE bookingEmail=%s",(member,))
			alreadyBook = cursor.fetchone()
			# print("檢查一下",alreadyBook)

			if  alreadyBook:
				cursor.execute(
                    "UPDATE booking SET attractionId = %s, date = %s, time = %s, price = %s WHERE bookingEmail = %s", 
                    (attractionId, date, time, price, member)
                )
				travel_db.commit()
				# print("覆蓋訂單")

				cursor.execute("SELECT * FROM booking WHERE bookingEmail = %s", (member,))
				updated_record = cursor.fetchone()
				print("確認新資料存入", updated_record)
				return {"ok": True}
			
			else:
				cursor.execute("INSERT INTO booking (bookingEmail, attractionId, date, time, price) VALUES(%s, %s, %s, %s, %s)",(member, attractionId, date, time, price))
				travel_db.commit()
				# print("已存入訂單")
				return {"ok": True}
			
		else:
			return {"error": True,"message": "未登入系統，拒絕存取"}
	except: 
		return {"error": True,"message": "伺服器內部錯誤"}

@app.delete("/api/booking")
async def deleteBooking(request:Request,user_data: dict = Depends(get_current_user)):
	member = user_data["email"]
	if 	user_data:
		cursor.execute("DELETE FROM booking WHERE bookingEmail = %s", (member,))
		travel_db.commit()
		print("已刪除景點資訊")
		return {"ok": True}
	else: 
		return {
            "error": True,
            "message": "請先登入再進行刪除"
        }

@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")

def generate_order_number():
    order_number = uuid.uuid4().int
    return str(order_number)[:14]

partner_key="partner_lS0ZgWzMPntujQuc6EH6XblU5tNe3VL9UyKgko0XVL4Zr8MkPnFLgOcW"
merchant_id="tppf_LynnCHI_GP_POS_1"

@app.post("/api/orders")
async def order(request:Request,user_data: dict = Depends(get_current_user)):
	
	if 	user_data:
		orderData = await request.json()
		orderData_json = json.dumps(orderData) 
		# print("檢查收到什麼資料",orderData)
		print("檢查收到什麼資料",orderData_json)
		# return{"檢查":"ok"}
		if 	orderData_json:
			order_number = generate_order_number()
			cursor.execute("INSERT INTO orderlist (data, order_number, record) VALUES (%s, %s, %s)", (orderData_json, order_number, "UNPAID"))
			travel_db.commit()
			print("訂單寫入完成")
			postData ={
				"prime": orderData["prime"],
				"partner_key": partner_key,
				"merchant_id": merchant_id,
				"details":"tour",
				"amount": orderData["order"]["price"],
				"order_number":order_number,
				"cardholder": {
					"phone_number": orderData["order"]["contact"]["phone"],
					"name":  orderData["order"]["contact"]["name"],
					"email": orderData["order"]["contact"]["email"],
					"zip_code": "",
					"address": "",
					"national_id": ""
				},
				"remember": False
			}
			try: 
				url="https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
				headers={
					"Content-Type": "application/json",
					"x-api-key": partner_key
				}

				async with httpx.AsyncClient() as client:
					response = await client.post(url, json=postData, headers=headers)
					response_data = response.json()
					print("response支付結果", response_data)
					

				# 付款成功
				if  response_data["status"] == 0:
					cursor.execute("UPDATE orderlist SET record = %s WHERE order_number=%s", ("PAID",response_data["order_number"]))
					print("檢查是否一樣",response_data["order_number"])
					travel_db.commit()
					print("成功付款，資料庫寫入ok")
					return {
						"data": {
							"number": response_data["order_number"],
							"payment": {
							"status": 0,
							"message": "付款成功"
							}
						}
					}
				else:
					print("付款失敗")
					return {
						"error": True,
						"message": "付款失敗"
					}
			except:
				return{
						"error": True,
						"message": "伺服器內部錯誤"
					}
		return {
			"error": True,
			"message": "未登入系統"
		}

# 取得訂單資訊	
@app.get("/api/order/{orderNumber}")
async def thankyou(request:Request, orderNumber: str, user_data: dict = Depends(get_current_user)):
	if	user_data:
		cursor.execute("SELECT data from orderlist WHERE order_number=%s",(orderNumber,))
		orderRecord= json.loads(cursor.fetchone()["data"])

		print("有找到資料",orderRecord)
		orderDetail={
			"data": {
				"number": orderNumber,
				"price": orderRecord["order"]["price"],
				"trip": {
				"attraction":orderRecord["order"]["trip"]["attraction"],
				"date": orderRecord["order"]["trip"]["date"],
				"time": orderRecord["order"]["trip"]["time"]
				},
				"contact":orderRecord["order"]["contact"] ,
				"status": 1
			}
		}
		print("訂單資訊",orderDetail)
		return orderDetail
	
	return{
			"error": True,
			"message": "請先登入"
			}
