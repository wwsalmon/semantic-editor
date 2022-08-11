import SlateEditor from "../components/SlateEditor";
import {useState} from "react";

export default function Home() {
    const [search, setSearch] = useState<string>("");

    return (
        <div className="mx-auto max-w-3xl px-4 my-8">
            <h1 className="font-bold mb-4">Semantic editor</h1>
            <div className="flex -mx-2">
                <div className="w-full px-2">
                    <div className="p-2 border min-h-[200px]">
                        <SlateEditor/>
                    </div>
                </div>
                <div className="ml-auto w-64 flex-shrink-0 px-2">
                    <input
                        type="text"
                        className="p-2 border w-full"
                        placeholder="Search in text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}