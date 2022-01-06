import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark as darktheme } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { coldarkCold as lighttheme } from "react-syntax-highlighter/dist/cjs/styles/prism";

const colorMode = "light";
const theme = colorMode === "light" ? lighttheme : darktheme;
const lineHighlight = colorMode === "light" ? "#dfefffcc" : "#37415180";

const convertLineStrToArray = (str) => {
  const lineArray = str.split(",").flatMap((s) => {
    if (!s.includes("-")) return +s;

    const [min, max] = s.split("-");

    return Array.from({ length: max - min + 1 }, (_, n) => n + +min);
  });
  return lineArray;
};

function code({ className, children, filename, hl, ...props }) {
  var linesToHighlight = convertLineStrToArray(hl);
  console.log(linesToHighlight);

  const match = /language-(\w+)/.exec(className || "");
  return match ? (
    <SyntaxHighlighter
      language={match[1]}
      PreTag="div"
      children={children.trim()}
      style={theme}
      wrapLines={true}
      showLineNumbers={true}
      lineProps={(lineNumber) => {
        const style = {
          display: "block",
          width: "100%",
        };
        if (linesToHighlight.includes(lineNumber)) {
          style.backgroundColor = lineHighlight;
          style.borderLeft = "4px solid #3b82f6";
          style.marginLeft = "-4px";
          style.marginLeft = "-4px";
        }
        return { style };
      }}
      {...props}
    />
  ) : (
    <code className={className} {...props} />
  );
}

export default code;
