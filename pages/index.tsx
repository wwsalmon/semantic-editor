import {useMemo} from "react";
import {withHistory} from "slate-history";
import {Slate, Editable, ReactEditor, withReact} from "slate-react";
import {createEditor, Descendant} from "slate";

const initialValue: Descendant[] = [
    {
        type: "paragraph",
        children: [
            {text: "Test"},
        ]
    }
]

export default function Home() {
    const editor = useMemo(() => withHistory(withReact(createEditor() as ReactEditor)), []);

    return (
        <>
            <p>Hello world</p>
            <Slate editor={editor} value={initialValue}>
                <Editable placeholder="Enter your text"/>
            </Slate>
        </>
    );
}