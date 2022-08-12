import {useCallback, useMemo} from "react";
import {withHistory} from "slate-history";
import {Editable, ReactEditor, Slate, withReact} from "slate-react";
import {createEditor, Descendant} from "slate";

function getText(d: Descendant) {
    if ("text" in d) return d.text;
    if ("children" in d) return getText(d.children[0]);
    return "";
}

export default function SlateEditor({value}: {value: Descendant[]}) {
    const editor = useMemo(() => withHistory(withReact(createEditor() as ReactEditor)), []);

    const renderElement = useCallback(({attributes, children, element}) => {
        return (
            <p {...attributes}>{children}</p>
        )
    }, []);

    const renderLeaf = useCallback(({attributes, children, leaf}) => {
        return (
            <span {...attributes} className="hover:bg-gray-300">{children}</span>
        )
    }, []);


    return (
        <div className="slateEditor">
            <Slate
                editor={editor}
                value={value}
            >
                <Editable readOnly placeholder="Enter your text" renderElement={renderElement} renderLeaf={renderLeaf}/>
            </Slate>
        </div>
    );
}