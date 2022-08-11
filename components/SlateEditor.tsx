import {Dispatch, SetStateAction, useMemo} from "react";
import {withHistory} from "slate-history";
import {Editable, ReactEditor, Slate, withReact} from "slate-react";
import {createEditor, Descendant} from "slate";

function getText(d: Descendant) {
    if ("text" in d) return d.text;
    if ("children" in d) return getText(d.children[0]);
    return "";
}

export default function SlateEditor({value, setValue}: { value: string, setValue: Dispatch<SetStateAction<string>> }) {
    const editor = useMemo(() => withHistory(withReact(createEditor() as ReactEditor)), []);

    return (
        <Slate
            editor={editor}
            value={value.split("\n").map(d => ({type: "paragraph", children: [{text: d}]}))}
            onChange={d => setValue(d.map(x => getText(x)).join("\n"))}
        >
            <Editable placeholder="Enter your text"/>
        </Slate>
    );
}