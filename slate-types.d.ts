import {BaseEditor, Descendant} from "slate";
import {ReactEditor} from "slate-react";
import {HistoryEditor} from "slate-history";

export type CustomElement = {
    type: string,
    children: Descendant[],
}

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor

declare module "slate" {
    interface CustomTypes {
        Editor: CustomEditor
        Element: CustomElement
        Text: {text: string}
    }
}