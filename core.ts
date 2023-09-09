export const isVerbose = () => process.env.VERBOSE === "true";
export const toSafeSID = (sid: string): [boolean, string] => {
  const safeSID = sid.trim().replace(/^\/+|\/+$/g, "");
  if (
    safeSID.includes("/") ||
    safeSID.includes("?") ||
    safeSID.includes("&") ||
    safeSID.includes("=")
  )
    return [false, ""];
  return [true, safeSID];
};

export const findInputDirUrl = async (
  sid: string,
  inputDoc: string
): Promise<[boolean, string]> => {
  const toSafeSubject = (subject: string) =>
    subject.toLowerCase().replace(/[^a-zA-Z]/g, "");

  try {
    if (isVerbose())
      console.log(`fetching '${inputDoc}' url for '${sid}'`.blue);
    const res = await fetch(`https://cahier-de-prepa.fr/${sid}/`);
    if (!res.ok) return [false, ""];

    const Subjects: { [K in string]: string } = {};
    let [currSubject, lastElem]: [string | null, string | null] = [null, null];

    new HTMLRewriter()
      .on("#menu > a, #menu > h3", {
        element: (elem) => {
          if (lastElem === "h3" && elem.tagName === "a") {
            const url = elem.getAttribute("href");
            if (!url || !currSubject) return;

            Subjects[toSafeSubject(currSubject)] = url;
          }
          if (lastElem === "h3" && elem.tagName === "a")
            [currSubject, lastElem] = [null, null];
          lastElem = elem.tagName;
        },
        text: (text) => {
          if (lastElem === "h3") currSubject = (currSubject ?? "") + text.text;
        },
      })
      .transform(res);
    if (!(toSafeSubject(inputDoc) in Subjects)) return [false, ""];

    if (isVerbose()) console.log(`Doc url found for '${sid}'`.green);
    const docUrl = Subjects[toSafeSubject(inputDoc)]
      .trim()
      .replace(/^\/+|\/+$/g, "");
    const newUrl = `https://cahier-de-prepa.fr/${sid}/${docUrl}`;

    return [true, newUrl];
  } catch (error) {
    console.error(error);
    return [false, ""];
  }
};

export interface DocumentTree {
  files: string[];
  name?: string | null;
  url?: string;
  subfolders: DocumentTree[];
}

export const indexDocs = async (
  cdp_url: string,
  parentIndex?: DocumentTree
): Promise<[boolean, DocumentTree | null]> => {
  try {
    const res = await fetch(cdp_url, {
      headers: {
        Cookie: `CDP_SESSION_PERM=${process.env.CDP_SESSION_PERM}; CDP_SESSION=${process.env.CDP_SESSION}`,
      },
    });
    if (isVerbose()) console.log(`indexing: ${cdp_url}: ${res.status}`);
    if (!res.ok) return [false, null];

    const subfoldersIndex: DocumentTree[] = [];
    let subfolderId = -1;

    const docs: string[] = [];

    let isLoginError = false;
    new HTMLRewriter()
      .on("#connexion", {
        element: () => {
          isLoginError = true;
        },
      })
      .on("body > section > .rep > a", {
        element: (elem) => {
          const href = elem.getAttribute("href");
          if (!href) return;
          subfolderId++;
          subfoldersIndex.push({
            name: null,
            url: href,
            files: [],
            subfolders: [],
          });
        },
        text: (text) => {
          if (text.text.trim().length <= 0) return;
          subfoldersIndex[subfolderId].name = text.text;
        },
      })
      .on("body > section > .doc > a", {
        element: (elem) => {
          const href = elem.getAttribute("href");
          if (!href) return;
          docs.push(href);
        },
      })
      .transform(res);
    if (isLoginError) {
      console.error(
        "Failed to query documents, your credentials are not valid".yellow.bold
      );
      return [false, null];
    }

    if (subfoldersIndex.length <= 0)
      return [
        true,
        {
          files: docs,
          subfolders: [],
          name: parentIndex?.name,
          url: parentIndex?.url,
        },
      ];

    // const subfolderResp = await Promise.all(
    //   subfoldersIndex.map(async (parent) => {
    //     const newUrl = cdp_url.split("/");
    //     newUrl[newUrl.length - 1] = `docs${parent.url}`;

    //     await Bun.sleep(1000); // to not overload the server
    //     return indexDocs(newUrl.join("/"), parent);
    //   })
    // );

    // if (!subfolderResp.every(([success, doc]) => success && doc !== null))
    //   return [false, null];

    // const subfoldersInfos = subfolderResp.map(([_, doc], i) => ({
    //   name: parentIndex?.name,
    //   url: parentIndex?.url,
    //   ...(doc as DocumentTree),
    // }));

    // for some reason if I try to parallelize the recusive calls it doesn't work as expected
    const subfoldersInfos: DocumentTree[] = [];
    for (const parent of subfoldersIndex) {
      const newUrl = cdp_url.split("/");
      newUrl[newUrl.length - 1] = `docs${parent.url}`;
      const [success, doc] = await indexDocs(newUrl.join("/"), parent);

      if (!success || doc === null) return [false, null];
      subfoldersInfos.push({
        name: parentIndex?.name,
        url: parentIndex?.url,
        ...(doc as DocumentTree),
      });
    }

    return [
      true,
      {
        files: docs,
        name: parentIndex?.name ?? "root",
        url: parentIndex?.url ?? cdp_url,
        subfolders: subfoldersInfos,
      },
    ];
  } catch (error) {
    console.error(error);
    return [false, null];
  }
};

const convertISOToUTF8 = (iso_str: string): string => {
  const bytes = new Uint8Array(iso_str.length);
  for (let i = 0; i < iso_str.length; i++) {
    bytes[i] = iso_str.charCodeAt(i);
  }

  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};

export const downloadDocumentsFiles = async (
  docsIndex: DocumentTree,
  sid: string
): Promise<[boolean, [string, string, Blob][]]> => {
  const filesToDownload = Array.from(
    JSON.stringify(docsIndex).matchAll(/download\?id=([0-9]+)/gm)
  );
  try {
    const filesDatas = (await Promise.all(
      filesToDownload.map(async ([uri]) => {
        const fileUrl = `https://cahier-de-prepa.fr/${sid}/${uri
          .trim()
          .replace(/^\/+|\/+$/g, "")}`;
        const resp = await fetch(fileUrl, {
          headers: {
            Cookie: `CDP_SESSION_PERM=${process.env.CDP_SESSION_PERM}; CDP_SESSION=${process.env.CDP_SESSION}`,
          },
        });

        const fileInfo = resp.headers.get("Content-Disposition");
        if (typeof fileInfo !== "string")
          return Promise.reject(`No file info: ${uri}`);

        const reMatches = Array.from(fileInfo.matchAll(/filename="(.*?)"/gm));
        if (reMatches.length !== 1)
          return Promise.reject(`No file info: ${uri}`);

        return [uri, convertISOToUTF8(reMatches[0][1]), await resp.blob()];
      })
    )) as [string, string, Blob][];
    return [true, filesDatas];
  } catch (error) {
    console.error(error);
    return [false, []];
  }
};
