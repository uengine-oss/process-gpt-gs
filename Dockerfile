FROM sanghoon01/spa-http-server:v1

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
#RUN npm install -g spa-http-server

# ARG DB_URL
# ARG DB_PW
ADD dist /opt/www
# ADD .env /opt/www
ADD docker-compose/.env /opt/www/.env
ADD run.sh /opt/run.sh
EXPOSE 8080
ENTRYPOINT ["sh","/opt/run.sh"]