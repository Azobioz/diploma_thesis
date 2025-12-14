
sleep 5


kafka-topics --bootstrap-server localhost:9090 \
  --create --if-not-exists \
  --topic board \
  --partitions 3 --replication-factor 1

kafka-topics --bootstrap-server localhost:9090 \
  --create --if-not-exists \
  --topic task-management \
  --partitions 3 --replication-factor 1

kafka-topics --bootstrap-server localhost:9090 \
  --create --if-not-exists \
  --topic account-and-team \
  --partitions 3 --replication-factor 1
