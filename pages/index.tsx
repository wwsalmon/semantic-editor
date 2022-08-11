import SlateEditor from "../components/SlateEditor";
import {useState} from "react";

export default function Home() {
    const [search, setSearch] = useState<string>("");
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [doc, setDoc] = useState<string>("Hello world");
    const [splitDoc, setSplitDoc] = useState<string[]>([]);

    function onSave() {
        setSplitDoc(doc.split(/[\n|\.|\?|\!]+\s*/));
        setIsSaved(true);
    }

    return (
        <div className="mx-auto max-w-3xl px-4 my-8">
            <h1 className="font-bold mb-4">Semantic editor</h1>
            {isSaved ? (
                <>
                    <input
                        type="text"
                        className="p-2 border w-full"
                        placeholder="Search in text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div>
                        {splitDoc.map((d, i) => (
                            <p key={i} className="my-6">{d}</p>
                        ))}
                    </div>
                    <button className="bg-black p-1 text-white" onClick={() => setIsSaved(false)}>Edit doc</button>
                </>
            ) : (
                <>
                    <div className="w-full">
                        <div className="p-2 border min-h-[200px]">
                            <SlateEditor value={doc} setValue={setDoc}/>
                        </div>
                    </div>
                    <button className="bg-black p-1 text-white" onClick={onSave }>Save doc</button>
                </>
            )}
        </div>
    );
}