docker compose run --rm --build tests npx vitest run "$@";
status=$?;
docker compose down -v;
exit $status;