(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s({
    "connect": (()=>connect),
    "setHooks": (()=>setHooks),
    "subscribeToUpdate": (()=>subscribeToUpdate)
});
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case "turbopack-connected":
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn("[Fast Refresh] performing full reload\n\n" + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + "You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n" + "Consider migrating the non-React component export to a separate file and importing it into both files.\n\n" + "It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n" + "Fast Refresh requires at least one parent function component in your React tree.");
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error("A separate HMR handler was already registered");
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: "turbopack-subscribe",
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: "turbopack-unsubscribe",
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: "ChunkListUpdate",
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === "added" && updateB.type === "deleted" || updateA.type === "deleted" && updateB.type === "added") {
        return undefined;
    }
    if (updateA.type === "partial") {
        invariant(updateA.instruction, "Partial updates are unsupported");
    }
    if (updateB.type === "partial") {
        invariant(updateB.instruction, "Partial updates are unsupported");
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: "EcmascriptMergedUpdate",
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === "added" && updateB.type === "deleted") {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === "deleted" && updateB.type === "added") {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: "partial",
            added,
            deleted
        };
    }
    if (updateA.type === "partial" && updateB.type === "partial") {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: "partial",
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === "added" && updateB.type === "partial") {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: "added",
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === "partial" && updateB.type === "deleted") {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: "deleted",
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    "bug",
    "error",
    "fatal"
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    "bug",
    "fatal",
    "error",
    "warning",
    "info",
    "log"
];
const CATEGORY_ORDER = [
    "parse",
    "resolve",
    "code generation",
    "rendering",
    "typescript",
    "other"
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case "issues":
            break;
        case "partial":
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === "notFound") {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}}),
"[project]/Components/NavBar/NavBar.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "NavBar": "NavBar-module__F_PfMG__NavBar",
  "NavBar_box": "NavBar-module__F_PfMG__NavBar_box",
  "NavBar_box_left": "NavBar-module__F_PfMG__NavBar_box_left",
  "NavBar_box_right": "NavBar-module__F_PfMG__NavBar_box_right",
  "NavBar_box_right_connect": "NavBar-module__F_PfMG__NavBar_box_right_connect",
  "NavBar_box_right_menu": "NavBar-module__F_PfMG__NavBar_box_right_menu",
  "NavBar_box_right_menu_items": "NavBar-module__F_PfMG__NavBar_box_right_menu_items",
  "NavBar_box_right_menu_items_link": "NavBar-module__F_PfMG__NavBar_box_right_menu_items_link",
  "active_btn": "NavBar-module__F_PfMG__active_btn",
  "modelBox": "NavBar-module__F_PfMG__modelBox",
});
}}),
"[project]/Context/ChatApp.json (json)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v(JSON.parse("{\"_format\":\"hh-sol-artifact-1\",\"contractName\":\"ChatApp\",\"sourceName\":\"contracts/ChatApp.sol\",\"abi\":[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"friendKey\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"friendName\",\"type\":\"string\"}],\"name\":\"addFriend\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"pubkey\",\"type\":\"address\"}],\"name\":\"checkUserExists\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"}],\"name\":\"createAccount\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getAllUsers\",\"outputs\":[{\"components\":[{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"accountAddress\",\"type\":\"address\"}],\"internalType\":\"struct ChatApp.AllUserStruct[]\",\"name\":\"\",\"type\":\"tuple[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getMyFriendList\",\"outputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"pubkey\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"}],\"internalType\":\"struct ChatApp.Friend[]\",\"name\":\"\",\"type\":\"tuple[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"pubkey\",\"type\":\"address\"}],\"name\":\"getUsername\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"friendKey\",\"type\":\"address\"}],\"name\":\"readMessages\",\"outputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"msg\",\"type\":\"string\"}],\"internalType\":\"struct ChatApp.Message[]\",\"name\":\"\",\"type\":\"tuple[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"friendKey\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"_msg\",\"type\":\"string\"}],\"name\":\"sendMessage\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}],\"bytecode\":\"0x6080604052348015600f57600080fd5b506121398061001f6000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063bd0f4d0d1161005b578063bd0f4d0d14610125578063ce43c03214610143578063de6f24bb14610173578063e2842d791461018f57610088565b80630459ed721461008d578063133f50f5146100bd578063298daf5b146100ed5780633b9f708d14610109575b600080fd5b6100a760048036038101906100a29190611260565b6101ad565b6040516100b49190611457565b60405180910390f35b6100d760048036038101906100d29190611260565b6103ec565b6040516100e49190611494565b60405180910390f35b61010760048036038101906101029190611514565b610446565b005b610123600480360381019061011e9190611561565b610624565b005b61012d610918565b60405161013a91906116c0565b60405180910390f35b61015d60048036038101906101589190611260565b610a9f565b60405161016a919061172c565b60405180910390f35b61018d60048036038101906101889190611561565b610bbb565b005b610197610e8b565b6040516101a4919061184d565b60405180910390f35b6060600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff1661027b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610272906118bb565b60405180910390fd5b60006102873384610fd2565b905060026000828152602001908152602001600020805480602002602001604051908101604052809291908181526020016000905b828210156103e057838290600052602060002090600302016040518060600160405290816000820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820154815260200160028201805461034f9061190a565b80601f016020809104026020016040519081016040528092919081815260200182805461037b9061190a565b80156103c85780601f1061039d576101008083540402835291602001916103c8565b820191906000526020600020905b8154815290600101906020018083116103ab57829003601f168201915b505050505081525050815260200190600101906102bc565b50505050915050919050565b600080600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600001805461043c9061190a565b9050119050919050565b61044f336103ec565b1561048f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161048690611987565b60405180910390fd5b600082829050116104d5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104cc906119f3565b60405180910390fd5b8181600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000019182610526929190611bf9565b506000604051806040016040528084848080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505081526020013373ffffffffffffffffffffffffffffffffffffffff16815250908060018154018082558091505060019003906000526020600020906002020160009091909190915060008201518160000190816105d69190611cc9565b5060208201518160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b61062d336103ec565b61066c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161066390611de7565b60405180910390fd5b610675836103ec565b6106b4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106ab90611e53565b60405180910390fd5b8273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1603610722576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161071990611ebf565b60405180910390fd5b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156107ef576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107e690611f2b565b60405180910390fd5b61083e338484848080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050611067565b6109138333600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000180546108909061190a565b80601f01602080910402602001604051908101604052809291908181526020018280546108bc9061190a565b80156109095780601f106108de57610100808354040283529160200191610909565b820191906000526020600020905b8154815290600101906020018083116108ec57829003601f168201915b5050505050611067565b505050565b6060600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101805480602002602001604051908101604052809291908181526020016000905b82821015610a9657838290600052602060002090600202016040518060400160405290816000820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600182018054610a059061190a565b80601f0160208091040260200160405190810160405280929190818152602001828054610a319061190a565b8015610a7e5780601f10610a5357610100808354040283529160200191610a7e565b820191906000526020600020905b815481529060010190602001808311610a6157829003601f168201915b5050505050815250508152602001906001019061097c565b50505050905090565b6060610aaa826103ec565b610ae9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ae090611f97565b60405180910390fd5b600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000018054610b369061190a565b80601f0160208091040260200160405190810160405280929190818152602001828054610b629061190a565b8015610baf5780601f10610b8457610100808354040283529160200191610baf565b820191906000526020600020905b815481529060010190602001808311610b9257829003601f168201915b50505050509050919050565b610bc4336103ec565b610c03576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bfa90611de7565b60405180910390fd5b610c0c836103ec565b610c4b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c4290611f97565b60405180910390fd5b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16610d17576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d0e90612003565b60405180910390fd5b60008282905011610d5d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d549061206f565b60405180910390fd5b6000610d693385610fd2565b90506002600082815260200190815260200160002060405180606001604052803373ffffffffffffffffffffffffffffffffffffffff16815260200142815260200185858080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050815250908060018154018082558091505060019003906000526020600020906003020160009091909190915060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550602082015181600101556040820151816002019081610e829190611cc9565b50505050505050565b60606000805480602002602001604051908101604052809291908181526020016000905b82821015610fc95783829060005260206000209060020201604051806040016040529081600082018054610ee29061190a565b80601f0160208091040260200160405190810160405280929190818152602001828054610f0e9061190a565b8015610f5b5780601f10610f3057610100808354040283529160200191610f5b565b820191906000526020600020905b815481529060010190602001808311610f3e57829003601f168201915b505050505081526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152505081526020019060010190610eaf565b50505050905090565b60008173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161061103557818360405160200161101a9291906120d7565b6040516020818303038152906040528051906020012061105f565b82826040516020016110489291906120d7565b604051602081830303815290604052805190602001205b905092915050565b600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060010160405180604001604052808473ffffffffffffffffffffffffffffffffffffffff16815260200183815250908060018154018082558091505060019003906000526020600020906002020160009091909190915060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160010190816111599190611cc9565b50505060018060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550505050565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061122d82611202565b9050919050565b61123d81611222565b811461124857600080fd5b50565b60008135905061125a81611234565b92915050565b600060208284031215611276576112756111f8565b5b60006112848482850161124b565b91505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6112c281611222565b82525050565b6000819050919050565b6112db816112c8565b82525050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561131b578082015181840152602081019050611300565b60008484015250505050565b6000601f19601f8301169050919050565b6000611343826112e1565b61134d81856112ec565b935061135d8185602086016112fd565b61136681611327565b840191505092915050565b600060608301600083015161138960008601826112b9565b50602083015161139c60208601826112d2565b50604083015184820360408601526113b48282611338565b9150508091505092915050565b60006113cd8383611371565b905092915050565b6000602082019050919050565b60006113ed8261128d565b6113f78185611298565b935083602082028501611409856112a9565b8060005b85811015611445578484038952815161142685826113c1565b9450611431836113d5565b925060208a0199505060018101905061140d565b50829750879550505050505092915050565b6000602082019050818103600083015261147181846113e2565b905092915050565b60008115159050919050565b61148e81611479565b82525050565b60006020820190506114a96000830184611485565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126114d4576114d36114af565b5b8235905067ffffffffffffffff8111156114f1576114f06114b4565b5b60208301915083600182028301111561150d5761150c6114b9565b5b9250929050565b6000806020838503121561152b5761152a6111f8565b5b600083013567ffffffffffffffff811115611549576115486111fd565b5b611555858286016114be565b92509250509250929050565b60008060006040848603121561157a576115796111f8565b5b60006115888682870161124b565b935050602084013567ffffffffffffffff8111156115a9576115a86111fd565b5b6115b5868287016114be565b92509250509250925092565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b600060408301600083015161160560008601826112b9565b506020830151848203602086015261161d8282611338565b9150508091505092915050565b600061163683836115ed565b905092915050565b6000602082019050919050565b6000611656826115c1565b61166081856115cc565b935083602082028501611672856115dd565b8060005b858110156116ae578484038952815161168f858261162a565b945061169a8361163e565b925060208a01995050600181019050611676565b50829750879550505050505092915050565b600060208201905081810360008301526116da818461164b565b905092915050565b600082825260208201905092915050565b60006116fe826112e1565b61170881856116e2565b93506117188185602086016112fd565b61172181611327565b840191505092915050565b6000602082019050818103600083015261174681846116f3565b905092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b600060408301600083015184820360008601526117978282611338565b91505060208301516117ac60208601826112b9565b508091505092915050565b60006117c3838361177a565b905092915050565b6000602082019050919050565b60006117e38261174e565b6117ed8185611759565b9350836020820285016117ff8561176a565b8060005b8581101561183b578484038952815161181c85826117b7565b9450611827836117cb565b925060208a01995050600181019050611803565b50829750879550505050505092915050565b6000602082019050818103600083015261186781846117d8565b905092915050565b7f4e6f7420667269656e6473207769746820746869732075736572000000000000600082015250565b60006118a5601a836116e2565b91506118b08261186f565b602082019050919050565b600060208201905081810360008301526118d481611898565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061192257607f821691505b602082108103611935576119346118db565b5b50919050565b7f5573657220616c72656164792065786973747300000000000000000000000000600082015250565b60006119716013836116e2565b915061197c8261193b565b602082019050919050565b600060208201905081810360008301526119a081611964565b9050919050565b7f557365726e616d652063616e6e6f7420626520656d7074790000000000000000600082015250565b60006119dd6018836116e2565b91506119e8826119a7565b602082019050919050565b60006020820190508181036000830152611a0c816119d0565b9050919050565b600082905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302611aaf7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82611a72565b611ab98683611a72565b95508019841693508086168417925050509392505050565b6000819050919050565b6000611af6611af1611aec846112c8565b611ad1565b6112c8565b9050919050565b6000819050919050565b611b1083611adb565b611b24611b1c82611afd565b848454611a7f565b825550505050565b600090565b611b39611b2c565b611b44818484611b07565b505050565b5b81811015611b6857611b5d600082611b31565b600181019050611b4a565b5050565b601f821115611bad57611b7e81611a4d565b611b8784611a62565b81016020851015611b96578190505b611baa611ba285611a62565b830182611b49565b50505b505050565b600082821c905092915050565b6000611bd060001984600802611bb2565b1980831691505092915050565b6000611be98383611bbf565b9150826002028217905092915050565b611c038383611a13565b67ffffffffffffffff811115611c1c57611c1b611a1e565b5b611c26825461190a565b611c31828285611b6c565b6000601f831160018114611c605760008415611c4e578287013590505b611c588582611bdd565b865550611cc0565b601f198416611c6e86611a4d565b60005b82811015611c9657848901358255600182019150602085019450602081019050611c71565b86831015611cb35784890135611caf601f891682611bbf565b8355505b6001600288020188555050505b50505050505050565b611cd2826112e1565b67ffffffffffffffff811115611ceb57611cea611a1e565b5b611cf5825461190a565b611d00828285611b6c565b600060209050601f831160018114611d335760008415611d21578287015190505b611d2b8582611bdd565b865550611d93565b601f198416611d4186611a4d565b60005b82811015611d6957848901518255600182019150602085019450602081019050611d44565b86831015611d865784890151611d82601f891682611bbf565b8355505b6001600288020188555050505b505050505050565b7f43726561746520616e206163636f756e74206669727374000000000000000000600082015250565b6000611dd16017836116e2565b9150611ddc82611d9b565b602082019050919050565b60006020820190508181036000830152611e0081611dc4565b9050919050565b7f55736572206973206e6f74207265676973746572656400000000000000000000600082015250565b6000611e3d6016836116e2565b9150611e4882611e07565b602082019050919050565b60006020820190508181036000830152611e6c81611e30565b9050919050565b7f596f752063616e27742061646420796f757273656c6600000000000000000000600082015250565b6000611ea96016836116e2565b9150611eb482611e73565b602082019050919050565b60006020820190508181036000830152611ed881611e9c565b9050919050565b7f416c726561647920667269656e64730000000000000000000000000000000000600082015250565b6000611f15600f836116e2565b9150611f2082611edf565b602082019050919050565b60006020820190508181036000830152611f4481611f08565b9050919050565b7f55736572206e6f74207265676973746572656400000000000000000000000000600082015250565b6000611f816013836116e2565b9150611f8c82611f4b565b602082019050919050565b60006020820190508181036000830152611fb081611f74565b9050919050565b7f596f7520617265206e6f7420667269656e647300000000000000000000000000600082015250565b6000611fed6013836116e2565b9150611ff882611fb7565b602082019050919050565b6000602082019050818103600083015261201c81611fe0565b9050919050565b7f4d6573736167652063616e6e6f7420626520656d707479000000000000000000600082015250565b60006120596017836116e2565b915061206482612023565b602082019050919050565b600060208201905081810360008301526120888161204c565b9050919050565b60008160601b9050919050565b60006120a78261208f565b9050919050565b60006120b98261209c565b9050919050565b6120d16120cc82611222565b6120ae565b82525050565b60006120e382856120c0565b6014820191506120f382846120c0565b601482019150819050939250505056fea2646970667358221220ca491c440659a90abd7903dc7d7ba9e272d810f77d7f6755ddea4923c8af034364736f6c634300081c0033\",\"deployedBytecode\":\"0x608060405234801561001057600080fd5b50600436106100885760003560e01c8063bd0f4d0d1161005b578063bd0f4d0d14610125578063ce43c03214610143578063de6f24bb14610173578063e2842d791461018f57610088565b80630459ed721461008d578063133f50f5146100bd578063298daf5b146100ed5780633b9f708d14610109575b600080fd5b6100a760048036038101906100a29190611260565b6101ad565b6040516100b49190611457565b60405180910390f35b6100d760048036038101906100d29190611260565b6103ec565b6040516100e49190611494565b60405180910390f35b61010760048036038101906101029190611514565b610446565b005b610123600480360381019061011e9190611561565b610624565b005b61012d610918565b60405161013a91906116c0565b60405180910390f35b61015d60048036038101906101589190611260565b610a9f565b60405161016a919061172c565b60405180910390f35b61018d60048036038101906101889190611561565b610bbb565b005b610197610e8b565b6040516101a4919061184d565b60405180910390f35b6060600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff1661027b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610272906118bb565b60405180910390fd5b60006102873384610fd2565b905060026000828152602001908152602001600020805480602002602001604051908101604052809291908181526020016000905b828210156103e057838290600052602060002090600302016040518060600160405290816000820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820154815260200160028201805461034f9061190a565b80601f016020809104026020016040519081016040528092919081815260200182805461037b9061190a565b80156103c85780601f1061039d576101008083540402835291602001916103c8565b820191906000526020600020905b8154815290600101906020018083116103ab57829003601f168201915b505050505081525050815260200190600101906102bc565b50505050915050919050565b600080600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600001805461043c9061190a565b9050119050919050565b61044f336103ec565b1561048f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161048690611987565b60405180910390fd5b600082829050116104d5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104cc906119f3565b60405180910390fd5b8181600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000019182610526929190611bf9565b506000604051806040016040528084848080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505081526020013373ffffffffffffffffffffffffffffffffffffffff16815250908060018154018082558091505060019003906000526020600020906002020160009091909190915060008201518160000190816105d69190611cc9565b5060208201518160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b61062d336103ec565b61066c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161066390611de7565b60405180910390fd5b610675836103ec565b6106b4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106ab90611e53565b60405180910390fd5b8273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1603610722576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161071990611ebf565b60405180910390fd5b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156107ef576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107e690611f2b565b60405180910390fd5b61083e338484848080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050611067565b6109138333600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000180546108909061190a565b80601f01602080910402602001604051908101604052809291908181526020018280546108bc9061190a565b80156109095780601f106108de57610100808354040283529160200191610909565b820191906000526020600020905b8154815290600101906020018083116108ec57829003601f168201915b5050505050611067565b505050565b6060600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101805480602002602001604051908101604052809291908181526020016000905b82821015610a9657838290600052602060002090600202016040518060400160405290816000820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600182018054610a059061190a565b80601f0160208091040260200160405190810160405280929190818152602001828054610a319061190a565b8015610a7e5780601f10610a5357610100808354040283529160200191610a7e565b820191906000526020600020905b815481529060010190602001808311610a6157829003601f168201915b5050505050815250508152602001906001019061097c565b50505050905090565b6060610aaa826103ec565b610ae9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ae090611f97565b60405180910390fd5b600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000018054610b369061190a565b80601f0160208091040260200160405190810160405280929190818152602001828054610b629061190a565b8015610baf5780601f10610b8457610100808354040283529160200191610baf565b820191906000526020600020905b815481529060010190602001808311610b9257829003601f168201915b50505050509050919050565b610bc4336103ec565b610c03576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bfa90611de7565b60405180910390fd5b610c0c836103ec565b610c4b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c4290611f97565b60405180910390fd5b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16610d17576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d0e90612003565b60405180910390fd5b60008282905011610d5d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d549061206f565b60405180910390fd5b6000610d693385610fd2565b90506002600082815260200190815260200160002060405180606001604052803373ffffffffffffffffffffffffffffffffffffffff16815260200142815260200185858080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050815250908060018154018082558091505060019003906000526020600020906003020160009091909190915060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550602082015181600101556040820151816002019081610e829190611cc9565b50505050505050565b60606000805480602002602001604051908101604052809291908181526020016000905b82821015610fc95783829060005260206000209060020201604051806040016040529081600082018054610ee29061190a565b80601f0160208091040260200160405190810160405280929190818152602001828054610f0e9061190a565b8015610f5b5780601f10610f3057610100808354040283529160200191610f5b565b820191906000526020600020905b815481529060010190602001808311610f3e57829003601f168201915b505050505081526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152505081526020019060010190610eaf565b50505050905090565b60008173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161061103557818360405160200161101a9291906120d7565b6040516020818303038152906040528051906020012061105f565b82826040516020016110489291906120d7565b604051602081830303815290604052805190602001205b905092915050565b600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060010160405180604001604052808473ffffffffffffffffffffffffffffffffffffffff16815260200183815250908060018154018082558091505060019003906000526020600020906002020160009091909190915060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160010190816111599190611cc9565b50505060018060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550505050565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061122d82611202565b9050919050565b61123d81611222565b811461124857600080fd5b50565b60008135905061125a81611234565b92915050565b600060208284031215611276576112756111f8565b5b60006112848482850161124b565b91505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6112c281611222565b82525050565b6000819050919050565b6112db816112c8565b82525050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561131b578082015181840152602081019050611300565b60008484015250505050565b6000601f19601f8301169050919050565b6000611343826112e1565b61134d81856112ec565b935061135d8185602086016112fd565b61136681611327565b840191505092915050565b600060608301600083015161138960008601826112b9565b50602083015161139c60208601826112d2565b50604083015184820360408601526113b48282611338565b9150508091505092915050565b60006113cd8383611371565b905092915050565b6000602082019050919050565b60006113ed8261128d565b6113f78185611298565b935083602082028501611409856112a9565b8060005b85811015611445578484038952815161142685826113c1565b9450611431836113d5565b925060208a0199505060018101905061140d565b50829750879550505050505092915050565b6000602082019050818103600083015261147181846113e2565b905092915050565b60008115159050919050565b61148e81611479565b82525050565b60006020820190506114a96000830184611485565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126114d4576114d36114af565b5b8235905067ffffffffffffffff8111156114f1576114f06114b4565b5b60208301915083600182028301111561150d5761150c6114b9565b5b9250929050565b6000806020838503121561152b5761152a6111f8565b5b600083013567ffffffffffffffff811115611549576115486111fd565b5b611555858286016114be565b92509250509250929050565b60008060006040848603121561157a576115796111f8565b5b60006115888682870161124b565b935050602084013567ffffffffffffffff8111156115a9576115a86111fd565b5b6115b5868287016114be565b92509250509250925092565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b600060408301600083015161160560008601826112b9565b506020830151848203602086015261161d8282611338565b9150508091505092915050565b600061163683836115ed565b905092915050565b6000602082019050919050565b6000611656826115c1565b61166081856115cc565b935083602082028501611672856115dd565b8060005b858110156116ae578484038952815161168f858261162a565b945061169a8361163e565b925060208a01995050600181019050611676565b50829750879550505050505092915050565b600060208201905081810360008301526116da818461164b565b905092915050565b600082825260208201905092915050565b60006116fe826112e1565b61170881856116e2565b93506117188185602086016112fd565b61172181611327565b840191505092915050565b6000602082019050818103600083015261174681846116f3565b905092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b600060408301600083015184820360008601526117978282611338565b91505060208301516117ac60208601826112b9565b508091505092915050565b60006117c3838361177a565b905092915050565b6000602082019050919050565b60006117e38261174e565b6117ed8185611759565b9350836020820285016117ff8561176a565b8060005b8581101561183b578484038952815161181c85826117b7565b9450611827836117cb565b925060208a01995050600181019050611803565b50829750879550505050505092915050565b6000602082019050818103600083015261186781846117d8565b905092915050565b7f4e6f7420667269656e6473207769746820746869732075736572000000000000600082015250565b60006118a5601a836116e2565b91506118b08261186f565b602082019050919050565b600060208201905081810360008301526118d481611898565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061192257607f821691505b602082108103611935576119346118db565b5b50919050565b7f5573657220616c72656164792065786973747300000000000000000000000000600082015250565b60006119716013836116e2565b915061197c8261193b565b602082019050919050565b600060208201905081810360008301526119a081611964565b9050919050565b7f557365726e616d652063616e6e6f7420626520656d7074790000000000000000600082015250565b60006119dd6018836116e2565b91506119e8826119a7565b602082019050919050565b60006020820190508181036000830152611a0c816119d0565b9050919050565b600082905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302611aaf7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82611a72565b611ab98683611a72565b95508019841693508086168417925050509392505050565b6000819050919050565b6000611af6611af1611aec846112c8565b611ad1565b6112c8565b9050919050565b6000819050919050565b611b1083611adb565b611b24611b1c82611afd565b848454611a7f565b825550505050565b600090565b611b39611b2c565b611b44818484611b07565b505050565b5b81811015611b6857611b5d600082611b31565b600181019050611b4a565b5050565b601f821115611bad57611b7e81611a4d565b611b8784611a62565b81016020851015611b96578190505b611baa611ba285611a62565b830182611b49565b50505b505050565b600082821c905092915050565b6000611bd060001984600802611bb2565b1980831691505092915050565b6000611be98383611bbf565b9150826002028217905092915050565b611c038383611a13565b67ffffffffffffffff811115611c1c57611c1b611a1e565b5b611c26825461190a565b611c31828285611b6c565b6000601f831160018114611c605760008415611c4e578287013590505b611c588582611bdd565b865550611cc0565b601f198416611c6e86611a4d565b60005b82811015611c9657848901358255600182019150602085019450602081019050611c71565b86831015611cb35784890135611caf601f891682611bbf565b8355505b6001600288020188555050505b50505050505050565b611cd2826112e1565b67ffffffffffffffff811115611ceb57611cea611a1e565b5b611cf5825461190a565b611d00828285611b6c565b600060209050601f831160018114611d335760008415611d21578287015190505b611d2b8582611bdd565b865550611d93565b601f198416611d4186611a4d565b60005b82811015611d6957848901518255600182019150602085019450602081019050611d44565b86831015611d865784890151611d82601f891682611bbf565b8355505b6001600288020188555050505b505050505050565b7f43726561746520616e206163636f756e74206669727374000000000000000000600082015250565b6000611dd16017836116e2565b9150611ddc82611d9b565b602082019050919050565b60006020820190508181036000830152611e0081611dc4565b9050919050565b7f55736572206973206e6f74207265676973746572656400000000000000000000600082015250565b6000611e3d6016836116e2565b9150611e4882611e07565b602082019050919050565b60006020820190508181036000830152611e6c81611e30565b9050919050565b7f596f752063616e27742061646420796f757273656c6600000000000000000000600082015250565b6000611ea96016836116e2565b9150611eb482611e73565b602082019050919050565b60006020820190508181036000830152611ed881611e9c565b9050919050565b7f416c726561647920667269656e64730000000000000000000000000000000000600082015250565b6000611f15600f836116e2565b9150611f2082611edf565b602082019050919050565b60006020820190508181036000830152611f4481611f08565b9050919050565b7f55736572206e6f74207265676973746572656400000000000000000000000000600082015250565b6000611f816013836116e2565b9150611f8c82611f4b565b602082019050919050565b60006020820190508181036000830152611fb081611f74565b9050919050565b7f596f7520617265206e6f7420667269656e647300000000000000000000000000600082015250565b6000611fed6013836116e2565b9150611ff882611fb7565b602082019050919050565b6000602082019050818103600083015261201c81611fe0565b9050919050565b7f4d6573736167652063616e6e6f7420626520656d707479000000000000000000600082015250565b60006120596017836116e2565b915061206482612023565b602082019050919050565b600060208201905081810360008301526120888161204c565b9050919050565b60008160601b9050919050565b60006120a78261208f565b9050919050565b60006120b98261209c565b9050919050565b6120d16120cc82611222565b6120ae565b82525050565b60006120e382856120c0565b6014820191506120f382846120c0565b601482019150819050939250505056fea2646970667358221220ca491c440659a90abd7903dc7d7ba9e272d810f77d7f6755ddea4923c8af034364736f6c634300081c0033\",\"linkReferences\":{},\"deployedLinkReferences\":{}}"));}}),
"[project]/Context/constants.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
//0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
__turbopack_context__.s({
    "ChatAppABI": (()=>ChatAppABI),
    "ChatAppAddress": (()=>ChatAppAddress)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatApp$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/Context/ChatApp.json (json)");
;
const ChatAppAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ChatAppABI = __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatApp$2e$json__$28$json$29$__["default"].abi;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Utils/apiFeature.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "CheckIfWalletConnected": (()=>CheckIfWalletConnected),
    "connectWallet": (()=>connectWallet),
    "connectingWithContract": (()=>connectingWithContract),
    "convertTime": (()=>convertTime),
    "fetchContract": (()=>fetchContract)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [client] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/web3modal/dist/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Context/constants.js [client] (ecmascript)");
;
;
;
const CheckIfWalletConnected = async ()=>{
    if (!window.ethereum) {
        throw new Error("MetaMask not installed");
    }
    const accounts = await window.ethereum.request({
        method: "eth_accounts"
    });
    return accounts[0];
};
_c = CheckIfWalletConnected;
const connectWallet = async ()=>{
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }
    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
    });
    if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
    }
    return accounts[0];
};
const fetchContract = (signerOrProvider)=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].Contract(__TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ChatAppAddress"], __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ChatAppABI"], signerOrProvider);
const connectingWithContract = async ()=>{
    try {
        const web3modal = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
        const connection = await web3modal.connect();
        const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
        const signer = provider.getSigner();
        return fetchContract(signer);
    } catch (error) {
        throw new Error("Could not connect to Web3Modal or Ethereum provider");
    }
};
const convertTime = (time)=>{
    const date = new Date(time.toNumber() * 1000); // Convert from seconds
    return date.toLocaleString(); // Better human-readable format
};
var _c;
__turbopack_context__.k.register(_c, "CheckIfWalletConnected");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Context/ChatAppContext.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
//ChatAppContext.js
__turbopack_context__.s({
    "ChatAppContext": (()=>ChatAppContext),
    "ChatAppProvider": (()=>ChatAppProvider)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Utils/apiFeature.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const ChatAppContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].createContext();
const ChatAppProvider = ({ children })=>{
    _s();
    const [account, setAccount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [userName, setUserName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [friendLists, setFriendLists] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [friendMsg, setFriendmsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [userLists, setUserLists] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    //User Data
    const [currentUserName, setCurrentUserName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [currentUserAddress, setCurrentUserAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const fetchData = async ()=>{
        try {
            const contract = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectingWithContract"])();
            const connectAccount = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectWallet"])();
            setAccount(connectAccount);
            // Check if user is registered
            const isUser = await contract.checkUserExists(connectAccount);
            if (isUser) {
                const userName = await contract.getUsername(connectAccount);
                setUserName(userName);
            } else {
                setUserName(""); // Show "Create Account" in UI
            }
            const friendLists = await contract.getMyFriendList();
            setFriendLists(friendLists);
            const userList = await contract.getAllUsers();
            setUserLists(userList);
        } catch (err) {
            console.error("fetchData error:", err.message);
            setError(err.message || "Please install and connect your wallet");
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatAppProvider.useEffect": ()=>{
            fetchData();
        }
    }["ChatAppProvider.useEffect"], []);
    const readMessage = async (friendAddress)=>{
        try {
            const contract = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectingWithContract"])();
            const read = await contract.readMessage(friendAddress);
            setFriendmsg(read);
        } catch (error) {
            setError("Currently No messages");
        }
    };
    const createAccount = async (name)=>{
        try {
            console.log("🔁 createAccount() called with:", name);
            const contract = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectingWithContract"])();
            console.log("✅ Connected to contract:", contract.address);
            const getCreatedUser = await contract.createAccount(name);
            console.log("⏳ Transaction sent, now waiting...");
            setLoading(true);
            await getCreatedUser.wait();
            setLoading(false);
            window.location.reload();
        } catch (error) {
            console.error("❌ Create account error:", error);
            setError("Error while creating the account. Please reload the browser.");
        }
    };
    const addFriend = async ({ accountAddress: accountAddress1, name })=>{
        try {
            if (!name || !accountAddress1) return setError("Please Provide the name and address ");
            const contract = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectingWithContract"])();
            const addMyFriend = await contract.addFriend(accountAddress1, name);
            setLoading(true);
            await addMyFriend.wait();
            setLoading(false);
            router.push("/");
            window.location.reload();
        } catch (error) {
            console.log(error);
            setError(error);
            setError("Error while adding your friend. Try Adding again!!");
        }
    };
    const sendMessage = async ({ msg, address })=>{
        try {
            if (!msg || !address) return setError("Please Type your message");
            const contract = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectingWithContract"])();
            const addMyFriend = await contract.sendMessage(accountAddress, msg);
            setLoading(true);
            await addMyFriend.wait();
            setLoading(false);
            window.location.reload();
        } catch (error) {
            setError("Please Reload and try again.");
        }
    };
    const readUser = async (userAddress)=>{
        const contract = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectingWithContract"])();
        const userName = contract.getUsername(userAddress);
        setCurrentUserName(userName);
        setCurrentUserAddress(userAddress);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChatAppContext.Provider, {
        value: {
            readMessage,
            createAccount,
            addFriend,
            sendMessage,
            readUser,
            account,
            userName,
            friendLists,
            friendMsg,
            loading,
            userLists,
            error,
            currentUserName,
            currentUserAddress,
            setFriendmsg,
            CheckIfWalletConnected: __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["CheckIfWalletConnected"],
            connectWallet: __TURBOPACK__imported__module__$5b$project$5d2f$Utils$2f$apiFeature$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectWallet"]
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Context/ChatAppContext.js",
        lineNumber: 130,
        columnNumber: 9
    }, this);
};
_s(ChatAppProvider, "su5Y6/jDcF1BZUV6Fp/U1PIu0wk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = ChatAppProvider;
var _c;
__turbopack_context__.k.register(_c, "ChatAppProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/logo.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/logo.32e1d218.png");}}),
"[project]/assets/logo.png.mjs { IMAGE => \"[project]/assets/logo.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$logo$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/logo.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$logo$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 225,
    height: 225,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAUUlEQVR42nWOMQ6AQAgE7/9fgxgLewo+oAUEKt0gMTmjU+3cFMc4fxjP2ospRISqrgUGtIO742kpMKAdzIyZ70BE0A6ZKSJbgQGdPj+Kj6teXP4gtbRMJ6BJAAAAAElFTkSuQmCC",
    blurWidth: 8,
    blurHeight: 8
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/user.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/user.6d702ab3.png");}}),
"[project]/assets/user.png.mjs { IMAGE => \"[project]/assets/user.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$user$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/user.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$user$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 1000,
    height: 1000,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAABE0lEQVR42gEIAff+ABgXFwIREBACUSUgRL9FN77pTz3xjDkwgBgUEwcNDA0BABEREQEbGBgFmzovl6U6LqeONy2HlzkvkR0YGAgYGBgCABkYGAIVEREGfjQrdDYdGiYyGhckfjYucBUSEgUbGhoCABYVFQIXFhYCPB4bLTofHCg1GRYqOx0aLRgXFwIREREBAA8PDwEVEhIELxwaHHwvJnV/MSh2KhgWGxQSEgQZGBgCAB0aGgdmJyBiwEY4vsRFNsXKSTrIxkc4x2opImUZFhYFACodHB+3RDeyuEI1ts1HN9HkTj3r9VI//8ZFNsoqHBsVACscGiPMSTrN6E898PFRPvv0Uj//9FI//81IONEtHRsYLoxDpJuZ57MAAAAASUVORK5CYII=",
    blurWidth: 8,
    blurHeight: 8
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/menu.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/menu.8fa8fcb7.png");}}),
"[project]/assets/menu.png.mjs { IMAGE => \"[project]/assets/menu.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$menu$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/menu.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$menu$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 225,
    height: 225,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAiUlEQVR42kVOywnEIBRMm0kHSQ852YmCInpYVBCsZNWL2oCe9rwTE8iA8N583rj8JsYYOeeUEoabWfBaa0KIzwTnHOslwMIY01qHEJxzSimsvfcFcdgJIfu+b9t2nqeUMsb4CsdxrOv6CkhRSnHKe48OsM8p9NRa0WmMsdYiXUp5fgXA8p3AcDN/W4KSrWxYImAAAAAASUVORK5CYII=",
    blurWidth: 8,
    blurHeight: 8
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/loader.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/loader.e07f2243.png");}}),
"[project]/assets/loader.png.mjs { IMAGE => \"[project]/assets/loader.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$loader$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/loader.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$loader$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 260,
    height: 194,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAPElEQVR42nWM2wkAIAwD3X+qUkrtw6EsFoQI3k9CDjLWh9GRmfNQBURNRMTMZgYiIlRVRNwdRL/dHxAPG2JecgEKEOiKAAAAAElFTkSuQmCC",
    blurWidth: 8,
    blurHeight: 6
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/profile.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/profile.ce04c998.png");}}),
"[project]/assets/profile.png.mjs { IMAGE => \"[project]/assets/profile.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$profile$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/profile.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$profile$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 225,
    height: 225,
    blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQABAAD/wAARCAAIAAgDAREAAhEBAxEB/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/9sAQwEKCwsODQ4cEBAcOygiKDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDH/wCE40j/AIWz/wAJH9rv/su/ytm0bdm3bnr93vjFAH//2Q==",
    blurWidth: 8,
    blurHeight: 8
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/search.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/search.c1c6b348.png");}}),
"[project]/assets/search.png.mjs { IMAGE => \"[project]/assets/search.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$search$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/search.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$search$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 259,
    height: 194,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAARUlEQVR42nWMsQkAMAgEs/8sDmEpFtZuoI0TWCQPqSTkm4e759f+ZN3KTGY2s+4eArSqVDUihsAWlIjcfQg8YAsqIkO8OdYCh+ipK8JhAAAAAElFTkSuQmCC",
    blurWidth: 8,
    blurHeight: 6
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/trash.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/trash.83642308.png");}}),
"[project]/assets/trash.png.mjs { IMAGE => \"[project]/assets/trash.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$trash$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/trash.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$trash$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 225,
    height: 225,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAb0lEQVR42n2LoREDIRQFf+MUEMsgooAhNhJEyNzQBA1AAVjs7X116la93Q+y9+69G2NeCgMlSinFe59S+ioMlCg5Zx7iH4WBEmWMEWOstR4KAyXKnDOE0Fr7KQyU+Hjg7/8Geh3WWtZa59xbYaDEEygShw2fI27LAAAAAElFTkSuQmCC",
    blurWidth: 8,
    blurHeight: 8
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/plus.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/plus.25539cda.png");}}),
"[project]/assets/plus.png.mjs { IMAGE => \"[project]/assets/plus.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$plus$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/plus.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$plus$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 225,
    height: 225,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAUUlEQVR42nWOsQ3AMAgEv8w0LjJo5oCecVgFkRO1ecny3xsD6u6qykx3NzMMSCiuiDjnPCMMSChKAEnvCAMSiu8UEn0jDEhbce4Pa6t1+LbuD+GjYPQ1Y+MmAAAAAElFTkSuQmCC",
    blurWidth: 8,
    blurHeight: 8
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/accountName.png (static in ecmascript)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v("/_next/static/media/accountName.068cea49.png");}}),
"[project]/assets/accountName.png.mjs { IMAGE => \"[project]/assets/accountName.png (static in ecmascript)\" } [client] (structured image object, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$accountName$2e$png__$28$static__in__ecmascript$29$__ = __turbopack_context__.i("[project]/assets/accountName.png (static in ecmascript)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$accountName$2e$png__$28$static__in__ecmascript$29$__["default"],
    width: 225,
    height: 225,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAiUlEQVR42nWOMQqEMBBFc521X9hiQbD3AB7Fys5az+AdLFQsLOxFELSy9ASJRiG+aGNj+JD//mRmIowx8jDFckS9RhiQI7iSUf9K5TcrwoCEgiffwqbxoBEGJBS0f3L5LICEtuDkMmjXbN4RxrkLdLm1CrvNq5V3GdCOYk866X+lmIAwoF3+9t0TiVeV4wJKPuYAAAAASUVORK5CYII=",
    blurWidth: 8,
    blurHeight: 8
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/assets/index.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$logo$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$logo$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/logo.png.mjs { IMAGE => "[project]/assets/logo.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$user$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$user$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/user.png.mjs { IMAGE => "[project]/assets/user.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$menu$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$menu$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/menu.png.mjs { IMAGE => "[project]/assets/menu.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$loader$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$loader$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/loader.png.mjs { IMAGE => "[project]/assets/loader.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$profile$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$profile$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/profile.png.mjs { IMAGE => "[project]/assets/profile.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$search$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$search$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/search.png.mjs { IMAGE => "[project]/assets/search.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$trash$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$trash$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/trash.png.mjs { IMAGE => "[project]/assets/trash.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$plus$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$plus$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/plus.png.mjs { IMAGE => "[project]/assets/plus.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$accountName$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$accountName$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/assets/accountName.png.mjs { IMAGE => "[project]/assets/accountName.png (static in ecmascript)" } [client] (structured image object, ecmascript)');
;
;
;
;
;
;
;
;
;
const __TURBOPACK__default__export__ = {
    logo: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$logo$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$logo$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    user: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$user$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$user$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    menu: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$menu$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$menu$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    loader: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$loader$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$loader$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    personpic: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$profile$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$profile$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    search: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$search$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$search$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    trash: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$trash$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$trash$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    plus: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$plus$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$plus$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"],
    friendname: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$accountName$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$assets$2f$accountName$2e$png__$28$static__in__ecmascript$2922$__$7d$__$5b$client$5d$__$28$structured__image__object$2c$__ecmascript$29$__["default"]
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/Model/Model.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "Model": "Model-module__e1IbCa__Model",
  "Model_box": "Model-module__e1IbCa__Model_box",
  "Model_box_left": "Model-module__e1IbCa__Model_box_left",
  "Model_box_right": "Model-module__e1IbCa__Model_box_right",
  "Model_box_right_info": "Model-module__e1IbCa__Model_box_right_info",
  "Model_box_right_name_btn": "Model-module__e1IbCa__Model_box_right_name_btn",
});
}}),
"[project]/Components/Loader/Loader.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "Loader": "Loader-module__cN7BCW__Loader",
  "Loader_box": "Loader-module__cN7BCW__Loader_box",
  "rotate": "Loader-module__cN7BCW__rotate",
});
}}),
"[project]/Components/Loader/Loader.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/Loader/Loader.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/assets/index.js [client] (ecmascript)");
;
;
;
;
;
const Loader = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Loader,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Loader_box,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].loader,
                alt: "loader",
                width: 100,
                height: 100
            }, void 0, false, {
                fileName: "[project]/Components/Loader/Loader.jsx",
                lineNumber: 11,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Components/Loader/Loader.jsx",
            lineNumber: 10,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Components/Loader/Loader.jsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
};
_c = Loader;
const __TURBOPACK__default__export__ = Loader;
var _c;
__turbopack_context__.k.register(_c, "Loader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/Loader/Loader.jsx [client] (ecmascript) <export default as Loader>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Loader": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Loader/Loader.jsx [client] (ecmascript)");
}}),
"[project]/Components/Model/Model.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/Model/Model.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Context/ChatAppContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/assets/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/Components/index.js [client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Components/Loader/Loader.jsx [client] (ecmascript) <export default as Loader>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
const Model = ({ openBox, title, head, info, smallInfo, images: modalImage, functionName, address })=>{
    _s();
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [accountAddress, setAccountAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const { loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ChatAppContext"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model_box,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model_box_left,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        src: modalImage,
                        alt: "modal-graphic",
                        width: 300,
                        height: 300
                    }, void 0, false, {
                        fileName: "[project]/Components/Model/Model.jsx",
                        lineNumber: 21,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Components/Model/Model.jsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model_box_right,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            children: [
                                title,
                                " ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: head
                                }, void 0, false, {
                                    fileName: "[project]/Components/Model/Model.jsx",
                                    lineNumber: 26,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Components/Model/Model.jsx",
                            lineNumber: 26,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: info
                        }, void 0, false, {
                            fileName: "[project]/Components/Model/Model.jsx",
                            lineNumber: 27,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                            children: smallInfo
                        }, void 0, false, {
                            fileName: "[project]/Components/Model/Model.jsx",
                            lineNumber: 28,
                            columnNumber: 11
                        }, this),
                        loading == true ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {}, void 0, false, {
                            fileName: "[project]/Components/Model/Model.jsx",
                            lineNumber: 32,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model_box_right_name,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model_box_right_info,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].user,
                                            alt: "user",
                                            width: 30,
                                            height: 30
                                        }, void 0, false, {
                                            fileName: "[project]/Components/Model/Model.jsx",
                                            lineNumber: 36,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            placeholder: "Enter Your NamE",
                                            value: name,
                                            onChange: (e)=>setName(e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/Components/Model/Model.jsx",
                                            lineNumber: 37,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Components/Model/Model.jsx",
                                    lineNumber: 35,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model_box_right_info,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].user,
                                            alt: "user",
                                            width: 30,
                                            height: 30
                                        }, void 0, false, {
                                            fileName: "[project]/Components/Model/Model.jsx",
                                            lineNumber: 47,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            placeholder: address || "Enter Address",
                                            value: accountAddress,
                                            onChange: (e)=>setAccountAddress(e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/Components/Model/Model.jsx",
                                            lineNumber: 48,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Components/Model/Model.jsx",
                                    lineNumber: 46,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Model_box_right_name_btn,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>functionName(name),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].user,
                                                    alt: "submit",
                                                    width: 30,
                                                    height: 30
                                                }, void 0, false, {
                                                    fileName: "[project]/Components/Model/Model.jsx",
                                                    lineNumber: 59,
                                                    columnNumber: 19
                                                }, this),
                                                "Submit"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Components/Model/Model.jsx",
                                            lineNumber: 58,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>openBox(false),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].user,
                                                    alt: "cancel",
                                                    width: 30,
                                                    height: 30
                                                }, void 0, false, {
                                                    fileName: "[project]/Components/Model/Model.jsx",
                                                    lineNumber: 64,
                                                    columnNumber: 19
                                                }, this),
                                                "Cancel"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Components/Model/Model.jsx",
                                            lineNumber: 63,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Components/Model/Model.jsx",
                                    lineNumber: 57,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Components/Model/Model.jsx",
                            lineNumber: 33,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Components/Model/Model.jsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Components/Model/Model.jsx",
            lineNumber: 17,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Components/Model/Model.jsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
};
_s(Model, "UgUg5oPuxFsh1uJLzmrEIAuzRow=");
_c = Model;
const __TURBOPACK__default__export__ = Model;
var _c;
__turbopack_context__.k.register(_c, "Model");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/Model/Model.jsx [client] (ecmascript) <export default as Model>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Model": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Model/Model.jsx [client] (ecmascript)");
}}),
"[project]/Components/Error/Error.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "Error": "Error-module__87Bj2G__Error",
  "Error_box": "Error-module__87Bj2G__Error_box",
});
}}),
"[project]/Components/Error/Error.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/Error/Error.module.css [client] (css module)");
;
;
;
const Error = ({ error })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Error,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Error_box,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    children: " Resolve the Error"
                }, void 0, false, {
                    fileName: "[project]/Components/Error/Error.jsx",
                    lineNumber: 9,
                    columnNumber: 13
                }, this),
                error
            ]
        }, void 0, true, {
            fileName: "[project]/Components/Error/Error.jsx",
            lineNumber: 8,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/Components/Error/Error.jsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
};
_c = Error;
const __TURBOPACK__default__export__ = Error;
var _c;
__turbopack_context__.k.register(_c, "Error");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/Error/Error.jsx [client] (ecmascript) <export default as Error>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Error": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Error/Error.jsx [client] (ecmascript)");
}}),
"[project]/Components/NavBar/NavBar.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/NavBar/NavBar.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Context/ChatAppContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/assets/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/Components/index.js [client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Model$3e$__ = __turbopack_context__.i("[project]/Components/Model/Model.jsx [client] (ecmascript) <export default as Model>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Error$3e$__ = __turbopack_context__.i("[project]/Components/Error/Error.jsx [client] (ecmascript) <export default as Error>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const NavBar = ()=>{
    _s();
    const menuItems = [
        {
            menu: "All Users",
            link: "/allusers"
        },
        {
            menu: "Chat",
            link: "/"
        },
        {
            menu: "Contact",
            link: "/"
        },
        {
            menu: "Settings",
            link: "/"
        }
    ];
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(2);
    const [openModel, setOpenModel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { account, userName, connectWallet, createAccount, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ChatAppContext"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar_box,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar_box_left,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].logo,
                                    alt: "Logo",
                                    width: 50,
                                    height: 50
                                }, void 0, false, {
                                    fileName: "[project]/Components/NavBar/NavBar.jsx",
                                    lineNumber: 30,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Components/NavBar/NavBar.jsx",
                                lineNumber: 29,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar_box_right,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar_box_right_menu,
                                        children: menuItems.map((el, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                onClick: ()=>setActive(i + 1),
                                                className: `
                    ${__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar_box_right_menu_items} 
                    ${active === i + 1 ? __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].active_btn : ""}
                  `,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: el.link,
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar_box_right_menu_items_link,
                                                    children: el.menu
                                                }, void 0, false, {
                                                    fileName: "[project]/Components/NavBar/NavBar.jsx",
                                                    lineNumber: 46,
                                                    columnNumber: 19
                                                }, this)
                                            }, i, false, {
                                                fileName: "[project]/Components/NavBar/NavBar.jsx",
                                                lineNumber: 38,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/Components/NavBar/NavBar.jsx",
                                        lineNumber: 36,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].NavBar_box_right_connect,
                                        children: account === "" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: connectWallet,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Connect Wallet"
                                            }, void 0, false, {
                                                fileName: "[project]/Components/NavBar/NavBar.jsx",
                                                lineNumber: 57,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Components/NavBar/NavBar.jsx",
                                            lineNumber: 56,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setOpenModel(true),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].user,
                                                    alt: "User",
                                                    width: 25,
                                                    height: 25
                                                }, void 0, false, {
                                                    fileName: "[project]/Components/NavBar/NavBar.jsx",
                                                    lineNumber: 61,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    children: userName || "Create Account"
                                                }, void 0, false, {
                                                    fileName: "[project]/Components/NavBar/NavBar.jsx",
                                                    lineNumber: 62,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Components/NavBar/NavBar.jsx",
                                            lineNumber: 60,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Components/NavBar/NavBar.jsx",
                                        lineNumber: 54,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Components/NavBar/NavBar.jsx",
                                lineNumber: 34,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Components/NavBar/NavBar.jsx",
                        lineNumber: 27,
                        columnNumber: 9
                    }, this),
                    openModel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].modelBox,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Model$3e$__["Model"], {
                            openBox: setOpenModel,
                            title: "WELCOME TO",
                            head: "CHAT BUDDY",
                            info: "Bhuvan",
                            smallInfo: "Select your name",
                            images: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].logo,
                            functionName: createAccount,
                            address: account
                        }, void 0, false, {
                            fileName: "[project]/Components/NavBar/NavBar.jsx",
                            lineNumber: 72,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Components/NavBar/NavBar.jsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Components/NavBar/NavBar.jsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            error !== "" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Error$3e$__["Error"], {
                error: error
            }, void 0, false, {
                fileName: "[project]/Components/NavBar/NavBar.jsx",
                lineNumber: 87,
                columnNumber: 24
            }, this)
        ]
    }, void 0, true);
};
_s(NavBar, "Lnf4As4PH6EA1Y4lY3u7p+zMZ3I=");
_c = NavBar;
const __TURBOPACK__default__export__ = NavBar;
var _c;
__turbopack_context__.k.register(_c, "NavBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/Filter/Filter.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "Filter": "Filter-module__q5qPXG__Filter",
  "Filter_model": "Filter-module__q5qPXG__Filter_model",
  "Fitler_box": "Filter-module__q5qPXG__Fitler_box",
  "Fitler_box_left": "Filter-module__q5qPXG__Fitler_box_left",
  "Fitler_box_right": "Filter-module__q5qPXG__Fitler_box_right",
});
}}),
"[project]/Components/Filter/Filter.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/Filter/Filter.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/assets/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Context/ChatAppContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/Components/index.js [client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Model$3e$__ = __turbopack_context__.i("[project]/Components/Model/Model.jsx [client] (ecmascript) <export default as Model>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
const Filter = ()=>{
    _s();
    const { account, addFriend } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ChatAppContext"]);
    const [addFriendName, setAddFriend] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Filter,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Fitler_box,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Fitler_box_left,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].search,
                                alt: "image",
                                width: 30,
                                height: 30
                            }, void 0, false, {
                                fileName: "[project]/Components/Filter/Filter.jsx",
                                lineNumber: 18,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "seach....."
                            }, void 0, false, {
                                fileName: "[project]/Components/Filter/Filter.jsx",
                                lineNumber: 19,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Components/Filter/Filter.jsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Fitler_box_right,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].trash,
                                        alt: "clear",
                                        height: 20,
                                        width: 20
                                    }, void 0, false, {
                                        fileName: "[project]/Components/Filter/Filter.jsx",
                                        lineNumber: 24,
                                        columnNumber: 13
                                    }, this),
                                    "CLEAR CHAT"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Components/Filter/Filter.jsx",
                                lineNumber: 23,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setAddFriend(true),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].plus,
                                        alt: "friend",
                                        height: 20,
                                        width: 20
                                    }, void 0, false, {
                                        fileName: "[project]/Components/Filter/Filter.jsx",
                                        lineNumber: 29,
                                        columnNumber: 13
                                    }, this),
                                    "ADD FRIEND"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Components/Filter/Filter.jsx",
                                lineNumber: 28,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Components/Filter/Filter.jsx",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Components/Filter/Filter.jsx",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            addFriendName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Filter_model,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Model$3e$__["Model"], {
                    openBox: setAddFriend,
                    title: "WELCOME TO",
                    head: "CHAT BUDDY",
                    info: "Bhuvan",
                    smallInfo: "Select your friend name",
                    images: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].logo,
                    functionName: addFriend,
                    address: ""
                }, void 0, false, {
                    fileName: "[project]/Components/Filter/Filter.jsx",
                    lineNumber: 37,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/Components/Filter/Filter.jsx",
                lineNumber: 36,
                columnNumber: 11
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Components/Filter/Filter.jsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
};
_s(Filter, "II3na0a+PLWA6iy9+cNrLsbqhgQ=");
_c = Filter;
const __TURBOPACK__default__export__ = Filter;
var _c;
__turbopack_context__.k.register(_c, "Filter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/UserCard/UserCard.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "UserCard": "UserCard-module__CHm8FG__UserCard",
  "UserCard_box": "UserCard-module__CHm8FG__UserCard_box",
  "UserCard_box_info": "UserCard-module__CHm8FG__UserCard_box_info",
});
}}),
"[project]/Components/UserCard/UserCard.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/UserCard/UserCard.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/assets/index.js [client] (ecmascript)");
;
;
;
;
;
const UserCard = ({ el, i, addFriend })=>{
    console.log(el);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].UserCard,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].UserCard_box,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                    src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].logo,
                    alt: "user",
                    width: 100,
                    height: 100
                }, void 0, false, {
                    fileName: "[project]/Components/UserCard/UserCard.jsx",
                    lineNumber: 13,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Components/UserCard/UserCard.jsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].UserCard_box_info,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: el.name
                    }, void 0, false, {
                        fileName: "[project]/Components/UserCard/UserCard.jsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            " ",
                            el.accountAddress
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Components/UserCard/UserCard.jsx",
                        lineNumber: 18,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>addFriend({
                                accountAddress: el.accountAddress,
                                name: el.name
                            }),
                        children: "Add Friend"
                    }, void 0, false, {
                        fileName: "[project]/Components/UserCard/UserCard.jsx",
                        lineNumber: 19,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Components/UserCard/UserCard.jsx",
                lineNumber: 16,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Components/UserCard/UserCard.jsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
};
_c = UserCard;
const __TURBOPACK__default__export__ = UserCard;
var _c;
__turbopack_context__.k.register(_c, "UserCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/Friend/Friend.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "Friend": "Friend-module__S9zcFG__Friend",
  "Friend_box": "Friend-module__S9zcFG__Friend_box",
  "Friend_box_left": "Friend-module__S9zcFG__Friend_box_left",
  "Friend_box_right": "Friend-module__S9zcFG__Friend_box_right",
});
}}),
"[project]/Components/Friend/Card/Card.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "Card": "Card-module__5J716G__Card",
  "Card_box": "Card-module__5J716G__Card_box",
  "Card_box_left": "Card-module__5J716G__Card_box_left",
  "Card_box_left_img": "Card-module__5J716G__Card_box_left_img",
  "Card_box_right": "Card-module__5J716G__Card_box_right",
  "Card_box_right_end": "Card-module__5J716G__Card_box_right_end",
  "Card_box_right_middle": "Card-module__5J716G__Card_box_right_middle",
});
}}),
"[project]/Components/Friend/Card/Card.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/Friend/Card/Card.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/assets/index.js [client] (ecmascript)");
;
;
;
;
;
;
const Card = ({ el, i, readMessage, readUser })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
        href: {
            pathname: "/",
            query: {
                name: el.name,
                address: el.pubkey
            }
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Card,
            onClick: ()=>{
                readMessage(el.pubkey);
                readUser(el.pubkey);
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Card_box,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Card_box_left,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            src: __TURBOPACK__imported__module__$5b$project$5d2f$assets$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].friendname,
                            alt: "username",
                            height: 50,
                            width: 50,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Card_box_left_img
                        }, void 0, false, {
                            fileName: "[project]/Components/Friend/Card/Card.jsx",
                            lineNumber: 25,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Components/Friend/Card/Card.jsx",
                        lineNumber: 24,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Card_box_right,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Card_box_right_middle,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        children: el.name
                                    }, void 0, false, {
                                        fileName: "[project]/Components/Friend/Card/Card.jsx",
                                        lineNumber: 36,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: [
                                            el.pubkey.slice(0, 6),
                                            "...",
                                            el.pubkey.slice(-4)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Components/Friend/Card/Card.jsx",
                                        lineNumber: 37,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Components/Friend/Card/Card.jsx",
                                lineNumber: 35,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Card_box_right_end,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: i + 1
                                }, void 0, false, {
                                    fileName: "[project]/Components/Friend/Card/Card.jsx",
                                    lineNumber: 41,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Components/Friend/Card/Card.jsx",
                                lineNumber: 40,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Components/Friend/Card/Card.jsx",
                        lineNumber: 34,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Components/Friend/Card/Card.jsx",
                lineNumber: 23,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Components/Friend/Card/Card.jsx",
            lineNumber: 16,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Components/Friend/Card/Card.jsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
};
_c = Card;
const __TURBOPACK__default__export__ = Card;
var _c;
__turbopack_context__.k.register(_c, "Card");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/Friend/Friend.jsx [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Friend$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Components/Friend/Friend.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Friend/Card/Card.jsx [client] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module './Chat/Chat'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Context/ChatAppContext.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
const Friend = ()=>{
    _s();
    const { readMessage, sendMessage, readUser, account, userName, friendLists, friendMsg, loading, currentUserName, currentUserAddress } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ChatAppContext"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Friend$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Friend,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Friend$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Friend_box,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Friend$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Friend_box_left,
                    children: friendLists.map((el, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Card$2f$Card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            el: el,
                            i: i,
                            readMessage: readMessage,
                            readUser: readUser
                        }, i, false, {
                            fileName: "[project]/Components/Friend/Friend.jsx",
                            lineNumber: 27,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/Components/Friend/Friend.jsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Friend$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].Friend_box_right,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Chat, {
                        functionName: sendMessage,
                        readMessage: readMessage,
                        friendMsg: friendMsg,
                        account: account,
                        userName: userName,
                        loading: loading,
                        currentUserName: currentUserName,
                        currentUserAddress: currentUserAddress
                    }, void 0, false, {
                        fileName: "[project]/Components/Friend/Friend.jsx",
                        lineNumber: 39,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Components/Friend/Friend.jsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Components/Friend/Friend.jsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Components/Friend/Friend.jsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
};
_s(Friend, "CAEjxDpstfdhGorDAmpyTXu3N/g=");
_c = Friend;
const __TURBOPACK__default__export__ = Friend;
var _c;
__turbopack_context__.k.register(_c, "Friend");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/index.js [client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/NavBar/NavBar.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Filter/Filter.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Loader/Loader.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Error/Error.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Model/Model.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/UserCard/UserCard.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Friend$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Friend/Friend.jsx [client] (ecmascript)");
;
;
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/Components/index.js [client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$NavBar$2f$NavBar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/NavBar/NavBar.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Filter$2f$Filter$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Filter/Filter.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Loader$2f$Loader$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Loader/Loader.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Error$2f$Error$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Error/Error.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Model$2f$Model$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Model/Model.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/UserCard/UserCard.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$Friend$2f$Friend$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/Friend/Friend.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Components/index.js [client] (ecmascript) <locals>");
}}),
"[project]/Components/UserCard/UserCard.jsx [client] (ecmascript) <export default as UserCard>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "UserCard": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Components/UserCard/UserCard.jsx [client] (ecmascript)");
}}),
"[project]/styles/allusers.module.css [client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "alluser": "allusers-module__YyIkQG__alluser",
  "alluser_info": "allusers-module__YyIkQG__alluser_info",
});
}}),
"[project]/pages/allusers.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/Components/index.js [client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCard$3e$__ = __turbopack_context__.i("[project]/Components/UserCard/UserCard.jsx [client] (ecmascript) <export default as UserCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$allusers$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/styles/allusers.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Context/ChatAppContext.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const allusers = ()=>{
    _s();
    const { userLists, addFriend } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$Context$2f$ChatAppContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ChatAppContext"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$allusers$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].alluser_info,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    children: "Find Your Friends"
                }, void 0, false, {
                    fileName: "[project]/pages/allusers.js",
                    lineNumber: 17,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/allusers.js",
                lineNumber: 16,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$allusers$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].alluser,
                children: userLists.map((el, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Components$2f$UserCard$2f$UserCard$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCard$3e$__["UserCard"], {
                        el: el,
                        i: i,
                        addFriend: addFriend
                    }, i + 1, false, {
                        fileName: "[project]/pages/allusers.js",
                        lineNumber: 22,
                        columnNumber: 17
                    }, this))
            }, void 0, false, {
                fileName: "[project]/pages/allusers.js",
                lineNumber: 20,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/allusers.js",
        lineNumber: 15,
        columnNumber: 5
    }, this);
};
_s(allusers, "MfWBJ/IbXSYLhplQsCxkyHlgohQ=");
const __TURBOPACK__default__export__ = allusers;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/allusers.js [client] (ecmascript)\" } [client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const PAGE_PATH = "/allusers";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/allusers.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}}),
"[project]/pages/allusers (hmr-entry)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, m: module } = __turbopack_context__;
{
__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/allusers.js [client] (ecmascript)\" } [client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ae8df63e._.js.map