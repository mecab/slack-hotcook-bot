import { RTMClient } from '@slack/rtm-api';
import { WebClient } from '@slack/web-api';
import { Hotcook } from '@mecab/hotcook';

const token = process.env.SLACK_TOKEN;

if (!token) {
    console.error('No SLACK_TOKEN given. Please specify in the environmental variable.')
    process.exit(1);
}

const rtm = new RTMClient(token);
const webClient = new WebClient(token);
const hotcook = new Hotcook();

function mentionToMe(e: { text?: string }): boolean {
    return (e?.text as string || '').includes(`<@${rtm.activeUserId}>`);
}

function messageWithoutMention(e: { text?: string }): string {
    const msg = (e?.text as string || '');
    return msg.replace(/<@.+?>/g, '').trim();
}

async function search(query: string) {
    const result = hotcook.search(query);
    const items = [];
    let error;
    try {
        for await (const res of result) {
            items.push(res);
        }
    }
    catch(err) {
        console.log(`error: ${err.name} - ${err.message}`);
        error = err;
    }

    return { recipes: items, error: error };
}

async function getRecipe(recipeNumber: string) {
    const result = await hotcook.recipe(recipeNumber);
    const { url, recipe } = result;
    const blocks = [];
    blocks.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*<${url}|${recipe.title}>*\n📖 ${recipe.recipeNumber}\n🕒 ${recipe.time}${recipe.calorie ? `\n🔥 ${recipe.calorie}` : ''}`,
        },
        accessory: {
            type: 'image',
            // eslint-disable-next-line @typescript-eslint/camelcase
            image_url: recipe.imageUrl,
            // eslint-disable-next-line @typescript-eslint/camelcase
            alt_text: 'recipe image'
        }
    });
    blocks.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*${recipe.materialTitle}*`,
        }
    });
    const materialGroups = recipe.materials.map(e => {
        const title = !!e.title ? '*' + e.title + '*\n' : '';
        const materials = e.materials.map(e => `- ${e.name}    ${e.amount}`).join('\n');

        return {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: title + materials
            }
        }
    });
    blocks.push(...materialGroups);
    if (recipe.note) {
        blocks.push({
            type: 'context',
            elements: [{
                type: 'mrkdwn',
                text: `${recipe.note}`
            }]
        });
    }
    blocks.push({
        type: 'divider'
    });
    const process = recipe.process.map((e, i) => {
        return {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${i + 1}.*  ${e}`
            }
        }
    });
    blocks.push(...process);
    return blocks;
}

async function onMessage(e: any): Promise<void> {
    if (e.type != 'message' || !mentionToMe(e)) {
        return;
    }

    rtm.sendTyping(e.channel);
    const msg = messageWithoutMention(e);

    if (msg === "") {
        await webClient.chat.postMessage({
            text: '検索する単語を入れてね',
            channel: e.channel,
            // eslint-disable-next-line @typescript-eslint/camelcase
            thread_ts: e.ts
        });
    }

    if (msg.match(/^R[0-9]+/)) {
        const blocks = await getRecipe(msg);
        await webClient.chat.postMessage({
            text: 'recipe',
            blocks,
            channel: e.channel,
            // eslint-disable-next-line @typescript-eslint/camelcase
            thread_ts: e.ts
        });
        return;
    }

    // await rtm.sendMessage(await search(msg), e.channel);
    const { recipes, error } = await search(msg);

    if (recipes.length === 1 && !error) {
        const blocks = await getRecipe(recipes[0].id);
        await webClient.chat.postMessage({
            text: 'recipe',
            blocks,
            channel: e.channel,
            // eslint-disable-next-line @typescript-eslint/camelcase
            thread_ts: e.ts
        });
        return;
    }

    let message = recipes.length ?
        recipes.map(e => `<${e.url}|${e.id}: ${e.name}>`).join('\n') : 'レシピが見つかりませんでした 😔';

    if (error) {
        message = message + '\n取得中にエラーが発生しました 😔'
    }

    await webClient.chat.postMessage({
        text: message,
        channel: e.channel,
        // eslint-disable-next-line @typescript-eslint/camelcase
        thread_ts: e.ts,
    });
}

(async (): Promise<void> => {
    await rtm.start();
    console.log(`connected. id: ${rtm.activeUserId}`);

    rtm.on('message', async (e) => {
        try {
            await onMessage(e);
        }
        catch(err) {
            console.log(`Unexpected error happened while processing message`);
            console.log(`Message:`);
            console.log(e);
            console.log('========');
            console.log(`Error:`);
            console.log(err);
        }
    });
})();
