export function ChatRichText({
  content,
  onCitation,
}: {
  content: string;
  onCitation: (index: number) => void;
}) {
  const blocks = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        return (
          <div key={blockIndex} className="space-y-1">
            {lines.map((line, index) => {
              const match = /^(\d+)\.\s+(.*)$/.exec(line);
              const text = match?.[2] || line;
              const tokens = text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean);
              return (
                <p key={index} className={match ? "flex gap-3" : ""}>
                  {match && <strong className="w-5 shrink-0">{match[1]}.</strong>}
                  <span>
                    {tokens.map((token, tokenIndex) => {
                      if (token.startsWith("**") && token.endsWith("**"))
                        return <strong key={tokenIndex}>{token.slice(2, -2)}</strong>;
                      if (/^\[\d+\]$/.test(token))
                        return (
                          <button
                            key={tokenIndex}
                            type="button"
                            className="font-bold text-blue-600 hover:underline"
                            onClick={() => onCitation(Number(token.slice(1, -1)) - 1)}
                          >
                            {token}
                          </button>
                        );
                      return <span key={tokenIndex}>{token}</span>;
                    })}
                  </span>
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
