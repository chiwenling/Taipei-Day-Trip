from fastapi import *
from fastapi.responses import FileResponse
import mysql.connector
from fastapi import FastAPI, Request, Form, Query, HTTPException
from fastapi.staticfiles import StaticFiles
import jwt
import datetime
from datetime import timezone
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWTError



app=FastAPI()
SECRET_KEY = "leeminho"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


travel_db = mysql.connector.connect(
	host="localhost",
	user="root",
	password="leeminho",
	database="travel"
)
print(travel_db)
cursor=travel_db.cursor(dictionary=True)


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
			print("data",data)
			print("name",name)
			
			cursor.execute("SELECT COUNT(*) AS COUNT FROM member WHERE email = %s", (email,))
			result = cursor.fetchone()
			print("result",result)
			print("有沒有",result["COUNT"])
			if result["COUNT"] > 0:
				return{
					"error": True,
					"message": "此email已註冊帳號"
				}
			else: 
				cursor.execute("INSERT INTO member (name, email, password) VALUES (%s, %s, %s)",(name, email, password))
				travel_db.commit()
				print("已存入")
				return {"ok": True}
			
									
		except mysql.connector.Error as err:
			return{
					"error": True,
					"message": "伺服器內部錯誤"
				}
		finally:
			if cursor:
				cursor.close()
			# travel_db.close()	
	 

# 取得會員資料
def create_jwt(user_data):
    expiration_time = datetime.datetime.now(tz=timezone.utc) + datetime.timedelta(days=7)
    payload = {
        "data": {
            "id": user_data["id"],
            "name": user_data["name"],
            "email": user_data["email"]
        },
        "exp": expiration_time
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def get_current_user(token: str = Depends(oauth2_scheme)):
    print(f"Received token: {token}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded payload: {payload}")
        user_data = payload.get("data")
        print("user_date:",user_data)
        if user_data is None:
            return {"data":None}
        return {"data":user_data}
    except PyJWTError as e:
        print(f"JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Token validation failed")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.put("/api/user/auth")
async def signin(request: Request):
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")
        cursor = travel_db.cursor(dictionary=True)
        print(email)
        print(password)
        cursor.execute("SELECT id, email, password, name FROM member WHERE email=%s AND password=%s", (email, password))
        member = cursor.fetchone()
        print(member)
        if member:
            member_info = {
                "id": member["id"],
                "name": member["name"],
                "email": member["email"]
            }
            token = create_jwt(member_info)
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

@app.get("/api/user/auth")
async def get_user_info(user_data: dict = Depends(get_current_user)):
	print("get result",user_data)
	return {"data": user_data}











# @app.get("/api/user/auth")
# async def memberInfo(request:Request, email: str,Authorize: AuthJWT = Depends()):
# 	Authorize.jwt_required() 
# 	cursor=None
# 	try:
# 		cursor = travel_db.cursor(dictionary=True)
# 		cursor.execute("SELECT id, name, email FROM member WHERE email = %s", (email,))
# 		member = cursor.fetchone()		
		
		
# 		if member:
# 			print("有找到會員資料")
# 			Authorize.get_jwt_subject()
# 			return{
# 				"data": {
# 				"id": member["id"],
# 				"name": member["name"],
# 				"email": member["email"]
# 				}
# 			}
# 		else:
# 			print("會員資料")
# 			return{"data":None}
		
# 	except mysql.connector.Error as err:
# 		print(f"Error: {err}")
# 		return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
# 	finally:
# 		if cursor:
# 			cursor.close()	

#檢查有沒有資料

# @app.put("/api/user/auth")
# async def signin(request:Request):
# 	try: 
# 		data = await request.json()
# 		email= data.get("email")
# 		password = data.get("password")
# 		cursor = travel_db.cursor(dictionary=True)
# 		print("檢查前端回傳的東西")
# 		print(email)
# 		print(password)
		
# 		cursor.execute("SELECT id, email, password FROM member WHERE email=%s AND password=%s",(email,password))
# 		member = cursor.fetchone()
# 		print(member)

# 		if 	member:
# 			memberInfo={
# 			"id":member["id"],
# 			"email": member["email"],
# 			"password": member["password"]
# 			}
			
# 			expiration_time = datetime.datetime.now(tz=timezone.utc) + datetime.timedelta(days=7)
# 			encoded_jwt = jwt.encode({**memberInfo, "exp": expiration_time}, SECRET_KEY, algorithm="HS256")
# 			print(encoded_jwt)
# 			return {"token": encoded_jwt}
		
# 		else:
# 			return{
# 			"error": True,
# 			"message": "請先註冊後登入"
# 			}

# 	except  mysql.connector.Error as err:
# 			return{
# 			"error": True,
# 			"message": "伺服器內部錯誤"
# 			}
# 	finally:
# 		if cursor:
# 			cursor.close()
# 		travel_db.close()



@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")

@app.get("/api/attractions")
async def searchAttraction(request: Request,page:int = Query(0), keyword: str = Query("")):
	try:
		cursor = travel_db.cursor(dictionary=True)
		page_size=12
		offset = page * page_size
		print(keyword)

		if 	keyword or page:
			cursor.execute("SELECT COUNT(*) AS total FROM attractions WHERE mrt=%s OR name LIKE %s",(keyword,f"%{keyword}%"))
			total_num= cursor.fetchone() 
			print(total_num)
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
 
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")