import {useState} from "react";
import similarity from "compute-cosine-similarity";
import "@tensorflow/tfjs-backend-webgl";
import classNames from "classnames";

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
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

            slateBlock.children.push({text: finalString, index: +slateIndex});

            if (isLine || +slateIndex === splitStrings.length - 1) {
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

    function onNavigate(index: number) {
        const sentenceEl = document.querySelector(`span[data-index="${index}"]`);
        sentenceEl.scrollIntoView({behavior: "smooth", block: "center"});
        setSelectedIndex(index);
    }

    return (
        <div className="mx-auto max-w-2xl px-4 my-8">
            {isSaved ? (
                <>
                    {docSplit ? (
                        <>
                            <div className="fixed left-0 top-0 h-full overflow-y-auto" style={{width: "calc(100vw - 320px)"}}>
                                <div className="mx-auto max-w-xl px-4 my-8">
                                    <div className="flex items-center mb-4">
                                        <button className="text-gray-500 underline" onClick={() => setIsSaved(false)}>Home</button>
                                        <span className="text-gray-500 mx-2">/</span>
                                        <h1 className="font-bold">Your document</h1>
                                    </div>
                                    <p className="text-sm text-gray-500">This document and its sentence embeddings are stored only in your browser. If you refresh the page you will have to re-enter the document.</p>
                                    <div className="prose my-8">
                                        {docSlate.map((paragraph, i) => (
                                            <p key={i}>
                                                {paragraph.children.map(sentence => (
                                                    <span
                                                        key={sentence.index}
                                                        className={classNames("hover:bg-gray-100 border-box", selectedIndex === sentence.index && "outline outline-2")}
                                                        style={{
                                                            backgroundColor: scores ? scoreToColor(scores[sentence.index]) : "white",
                                                        }}
                                                        data-index={sentence.index}
                                                    >{sentence.text}</span>
                                                ))}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="fixed w-80 p-4 right-0 top-0 h-full border-l overflow-y-auto">
                                <h2 className="font-bold">Semantic search</h2>
                                <textarea
                                    className="p-2 border w-full bg-gray-100 rounded-md border-none my-4"
                                    placeholder="Semantic search in text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button className="p-2 bg-slate-800 text-white text-sm rounded-md" onClick={onSearch}>Search</button>
                                <span className="mx-4 text-gray-500 text-sm">{status}</span>
                                {status === "done" && (
                                    <button
                                        className="p-2 rounded-md bg-gray-200 text-sm"
                                        onClick={() => {
                                            setScores(null);
                                            setStatus("ready");
                                        }}
                                    >
                                        Reset
                                    </button>
                                )}
                                {scores && (
                                    <p className="my-4 text-sm text-gray-500">{scores.filter(d => d >= 0.5).length} matches above <code className="text-sm bg-gray-100 p-1 rounded-sm">0.5</code></p>
                                )}
                                <hr className="-mx-4 my-4"/>
                                {sortedSplitDoc.map(d => (
                                    <button
                                        className={classNames("block p-4 -mx-4 text-left hover:bg-gray-100", d.index === selectedIndex && "outline outline-2")}
                                        key={d.index}
                                        onClick={() => onNavigate(d.index)}
                                    >
                                        {d.text}{scores && (
                                            <span style={{backgroundColor: scoreToColor(scores[d.index])}}>
                                                {` (${scores[d.index]})`}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p>{status}</p>
                    )}
                </>
            ) : (
                <>
                    <div className="prose my-12">
                        <h1>
                            Semantic document viewer
                        </h1>
                        <p>An experiment by <a href="twitter.com/wwsalmon">Samson Zhang</a></p>
                        <p>Input the text for your document below, then hit "calculate embeddings" to be able to semantically search through it.</p>
                        <p>All calculations are done on your browser (no user data is ever sent to the server), but there are some performance issues at the moment that may cause your browser to freeze up or crash if you have long sentences in your document.</p>
                    </div>
                    <hr className="my-12"/>
                    <div className="w-full">
                        <div className="relative my-4">
                            <textarea value={docInput} onChange={e => setDocInput(e.target.value)} className="absolute top-0 left-0 right-0 bottom-0 w-full h-full p-2 overflow-hidden bg-gray-100 rounded-md border-none"/>
                            <p className="min-h-[200px] pointer-events-none p-2 opacity-0 whitespace-pre-line">{docInput}</p>
                        </div>
                    </div>
                    <button className="bg-slate-800 rounded-md p-2 text-white" onClick={onSave}>Calculate embeddings</button>
                    <hr className="my-12"/>
                    <div className="prose my-12">
                        <h2>Use cases</h2>
                        <ul>
                            <li>For journalists: searching through interview transcripts for relevant quotes</li>
                            <li>For researchers: searching through paper texts for relevant passages</li>
                        </ul>
                        <h2>Implementation details</h2>
                        <p>Embeddings for each sentence are calculated using <a href="https://www.tensorflow.org/hub/tutorials/semantic_similarity_with_tf_hub_universal_encoder">Universal Sentence Encoder</a> via Tensorflow.js, then compared to the embedding of search strings using cosine similarity.</p>
                        <p>You can find the full code for this app <a href="https://github.com/wwsalmon/semantic-editor">on GitHub here</a>.</p>
                    </div>
                </>
            )}
        </div>
    );
}