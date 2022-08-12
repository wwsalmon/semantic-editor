import SlateEditor from "../components/SlateEditor";
import {useState} from "react";
const use = require("@tensorflow-models/universal-sentence-encoder");
import similarity from "compute-cosine-similarity";
import "@tensorflow/tfjs-backend-webgl";

export default function Home() {
    const [search, setSearch] = useState<string>("");
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [doc, setDoc] = useState<string>("Hello world");
    const [splitDoc, setSplitDoc] = useState<{text: string, embedding: number[], index: number}[] | null>(null);
    const [scores, setScores] = useState<number[] | null>(null);
    const [status, setStatus] = useState<string>("ready");

    function onSave() {
        setScores(null);
        setSplitDoc(null);
        setIsSaved(true);

        const splitPunctuation = Array.from(doc.matchAll(/[\n|\.|\?|\!]+\s*/g));
        const splitStrings = doc.split(/[\n|\.|\?|\!]+\s*/).map((d, i) => d + (splitPunctuation[i] || "")).filter(d => d);

        setStatus("loading model... (1/2)");
        use.load().then(model => {
            setStatus("computing embeddings... (2/2)")
            model.embed(splitStrings).then(embeddingsTensor => {
                embeddingsTensor.array().then(arr => {
                    const splitDoc = splitStrings
                        .map((d, i) => ({index: i, text: d, embedding: arr[i]}));
                    setSplitDoc(splitDoc);
                    setStatus("ready");
                })
            });
        });
    }

    function onSearch() {
        setStatus("loading model... (1/3)")
        use.load().then(model => {
            setStatus("computing embedding... (2/3)")
            model.embed([search]).then(embeddingsTensor => {
                setStatus("computing similarities... (3/3)")
                const embeddings = embeddingsTensor.arraySync();
                const searchEmbedding = embeddings[0];
                const scores = splitDoc.map((d, i) => {
                    const score = similarity(d.embedding, searchEmbedding);
                    console.log(score, d, i);
                    return score;
                });
                setScores(scores);
                setStatus("done");
            });
        });
    }

    const sortedSplitDoc = scores ? [...splitDoc].sort((a, b) => scores[b.index] - scores[a.index]).slice(0, 5) : splitDoc;

    return (
        <div className="mx-auto max-w-3xl px-4 my-8">
            <h1 className="font-bold mb-4">Semantic editor</h1>
            {isSaved ? (
                <>
                    {splitDoc ? (
                        <>
                            <textarea
                                className="p-2 border w-full"
                                placeholder="Search in text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button className="p-2 bg-gray-300" onClick={onSearch}>Search</button>
                            <span className="ml-4">{status}</span>
                            {status === "done" && (
                                <button className="p-2 bg-black text-white" onClick={() => {
                                    setScores(null);
                                    setStatus("ready");
                                }}>Reset</button>
                            )}
                            {sortedSplitDoc.map(d => (
                                <p className="my-6" key={d.index}>{d.text}{scores && ` (${scores[d.index]})`}</p>
                            ))}
                            <button className="bg-black p-1 text-white" onClick={() => setIsSaved(false)}>Edit doc</button>
                        </>
                    ) : (
                        <p>{status}</p>
                    )}
                </>
            ) : (
                <>
                    <div className="w-full">
                        <div className="relative my-4">
                            <textarea value={doc} onChange={e => setDoc(e.target.value)} className="absolute top-0 left-0 right-0 bottom-0 w-full h-full p-2 border overflow-hidden"/>
                            <p className="min-h-[200px] pointer-events-none p-2 border whitespace-pre-line">{doc}</p>
                        </div>
                    </div>
                    <button className="bg-black p-1 text-white" onClick={onSave}>Save doc</button>
                </>
            )}
        </div>
    );
}