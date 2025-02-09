export async function getGistsByUserName(username: string) {
  return fetch(`https://api.github.com/users/${username}/gists`, {
    headers: {
      Authorization: "Bearer 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",
    },
  }).then((res) => res.json())
}

export async function getGistById(gistId: string) {
  return fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: "Bearer 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",
    },
  }).then((res) => res.json())
}

export async function createGist(data: any) {
  return fetch(`https://api.github.com/gists`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: "Bearer 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",
    },
    body: JSON.stringify(data),
  }).then((res) => res.json())
}
