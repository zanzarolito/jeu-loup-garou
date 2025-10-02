FROM alpine:latest
WORKDIR /app
COPY pocketbase ./pocketbase
COPY pb_migrations ./pb_migrations
COPY start.sh ./start.sh
RUN chmod +x ./pocketbase ./start.sh
EXPOSE 8090
CMD ["./start.sh"]