import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-rust";
import { useMemo, type ReactNode } from "react";
import type { CodeTab } from "../content/model";

const grammars: Partial<Record<CodeTab["language"], Prism.Grammar>> = {
  bash: Prism.languages.bash,
  rust: Prism.languages.rust,
};

function renderToken(token: string | Prism.Token, key: string): ReactNode {
  if (typeof token === "string") return token;

  const aliases = token.alias
    ? Array.isArray(token.alias)
      ? token.alias
      : [token.alias]
    : [];
  const content = Array.isArray(token.content)
    ? token.content
    : [token.content];

  return (
    <span className={["token", token.type, ...aliases].join(" ")} key={key}>
      {content.map((child, index) =>
        renderToken(child, `${key}-${String(index)}`),
      )}
    </span>
  );
}

export function HighlightedCode({
  code,
  language,
}: {
  code: string;
  language: CodeTab["language"];
}) {
  const tokens = useMemo(() => {
    const grammar = grammars[language];
    return grammar ? Prism.tokenize(code, grammar) : [code];
  }, [code, language]);

  return (
    <code className={`language-${language}`}>
      {tokens.map((token, index) =>
        renderToken(token, String(index)),
      )}
    </code>
  );
}
