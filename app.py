from fastapi import *
from fastapi.responses import FileResponse
import mysql.connector
from fastapi import FastAPI, Request, Form, Query, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
import jwt
from datetime import timedelta, timezone
import datetime
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated
from pydantic import BaseModel


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
    print(token)
    return token

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        print("前方回來的token",token)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_data = payload.get("data")
        print(f"Decoded payload: {payload}")
        print("user_date:",user_data)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        return user_data
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(),
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.get("/api/user/auth")
async def get_user_info(user_data: dict = Depends(get_current_user)):
    print("要給前端的資料",user_data)
    return {"data": user_data}


@app.put("/api/user/auth")
async def signin(request: Request):
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")
        cursor = travel_db.cursor(dictionary=True)
        print("檢查前端回傳的東西")
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

