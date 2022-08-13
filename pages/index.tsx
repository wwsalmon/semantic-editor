import {useState} from "react";
import similarity from "compute-cosine-similarity";
import "@tensorflow/tfjs-backend-webgl";

const use = require("@tensorflow-models/universal-sentence-encoder");

function scoreToColor(score: number) {
    return `rgba(0,255,0,${(Math.max(score, 0.5) - 0.5) * (1 / 0.5)})`;
}

export default function Home() {
    const [search, setSearch] = useState<string>("");
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [docInput, setDocInput] = useState<string>("Hello world");
    const [docSplit, setDocSplit] = useState<{text: string, embedding: number[], index: number}[] | null>(null);
    const [docSlate, setDocSlate] = useState<{type: "paragraph", children: {text: string, index: number}[]}[]>([]);
    const [scores, setScores] = useState<number[] | null>(null);
    const [status, setStatus] = useState<string>("ready");

    function onSave() {
        setScores(null);
        setDocSplit(null);
        setIsSaved(true);

        const splitPunctuation = Array.from(docInput.matchAll(/[\n|\.|\?|\!]+\s*/g)).map(d => d[0]);
        const splitStrings = docInput.split(/[\n|\.|\?|\!]+\s*/).map((d, i) => d + (splitPunctuation[i] || "")).filter(d => d);

        let slateDoc = [];
        const slateBlockEmpty = {
            type: "paragraph",
            children: [],
        };
        let slateBlock = JSON.parse(JSON.stringify(slateBlockEmpty));

        for (let slateIndex in splitStrings) {
            const thisString = splitStrings[slateIndex];
            const isLine = thisString.includes("\n");
            const finalString = thisString.replace(/\n/g, "");

            slateBlock.children.push({text: finalString, index: slateIndex});

            if (isLine) {
                slateDoc.push(slateBlock);
                slateBlock = JSON.parse(JSON.stringify(slateBlockEmpty));
            }
        }

        setDocSlate(slateDoc);

        setStatus("loading model... (1/2)");
        use.load().then(model => {
            setStatus("computing embeddings... (2/2)")
            model.embed(splitStrings).then(embeddingsTensor => {
                embeddingsTensor.array().then(arr => {
                    const splitDoc = splitStrings
                        .map((d, i) => ({index: i, text: d, embedding: arr[i]}));
                    setDocSplit(splitDoc);
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
                const scores = docSplit.map((d, i) => {
                    const score = similarity(d.embedding, searchEmbedding);
                    console.log(score, d, i);
                    return score;
                });
                setScores(scores);
                setStatus("done");
            });
        });
    }

    const sortedSplitDoc = scores ? [...docSplit].filter(d => scores[d.index] >= 0.5).sort((a, b) => scores[b.index] - scores[a.index]).slice(0, 10) : [];

    return (
        <div className="mx-auto max-w-3xl px-4 my-8">
            <h1 className="font-bold mb-4">Semantic editor</h1>
            {isSaved ? (
                <>
                    {docSplit ? (
                        <>
                            {docSlate.map((paragraph, i) => (
                                <p key={i} className="my-8">
                                    {paragraph.children.map(sentence => (
                                        <span
                                            key={sentence.index}
                                            className="hover:bg-gray-100"
                                            style={{backgroundColor: scores ? scoreToColor(scores[sentence.index]) : "white"}}
                                        >{sentence.text}</span>
                                    ))}
                                </p>
                            ))}
                            <div className="fixed w-80 p-4 right-0 top-0 h-full border-l overflow-y-auto">
                                <textarea
                                    className="p-2 border w-full"
                                    placeholder="Semantic search in text"
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
                                {scores && (
                                    <p className="my-4">{scores.filter(d => d >= 0.5).length} matches above <code className="text-sm bg-gray-100 p-1 rounded-sm">0.5</code></p>
                                )}
                                {sortedSplitDoc.map(d => (
                                    <p className="my-6" key={d.index}>{d.text}{scores && (
                                        <span style={{backgroundColor: scoreToColor(scores[d.index])}}>
                                            {` (${scores[d.index]})`}
                                        </span>
                                    )}</p>
                                ))}
                            </div>
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
                            <textarea value={docInput} onChange={e => setDocInput(e.target.value)} className="absolute top-0 left-0 right-0 bottom-0 w-full h-full p-2 border overflow-hidden"/>
                            <p className="min-h-[200px] pointer-events-none p-2 border whitespace-pre-line">{docInput}</p>
                        </div>
                    </div>
                    <button className="bg-black p-1 text-white" onClick={onSave}>Save doc</button>
                </>
            )}
        </div>
    );
}