export async function hasuraRequest(query: string, variables = {}) {
    const response = await fetch(process.env.HASURA_URL!, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET!,
        },
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) throw new Error(JSON.stringify(result.errors));
    return result.data;
}