docker compose run --rm --build tests npx vitest run "$@" --silent;
status=$?;
docker compose down -v;
exit $status;