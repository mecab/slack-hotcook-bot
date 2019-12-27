import assert = require('assert');

import path from 'path'
import fs from 'fs';
import {Parser, RecipeInfo, Recipe} from '../src/hotcook/parser';

describe('parseSearchResult test', () => {
    let testInput: string;
    let result: RecipeInfo[];

    before(function() {
        testInput = fs.readFileSync(path.join(__dirname, 'data/searchResult.html'), 'utf-8');
    });

    it('can parser the test input', async function() {
        const parser = new Parser('https://cook-healsio.jp/hotcook/HW24C/recipes');
        result = parser.parseSearchResult(testInput);
    });

    it('has 9 results', async function() {
        assert(result.length === 12);
    })

    it ('has correct property on its first item', async function() {
        const first = result[0];
        assert(first.id === 'R4086');
        assert(first.name === 'いも・かぼちゃ(ゆで)');
        assert(first.url === 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4086');
        assert(first.imageUrl === 'https://cook-healsio.jp/hotcook/asset/images/search/img_recipe_pc.png');
    });
});

describe('parseRecipe test', () => {
    let testInput: string;
    let result: Recipe;

    before(function() {
        testInput = fs.readFileSync(path.join(__dirname, 'data/recipe.html'), 'utf-8');
    });

    it('can parser the test input', async function() {
        const parser = new Parser('https://cook-healsio.jp/hotcook/HW24C/recipes');
        result = parser.parseRecipe(testInput);
    });

    it('has correct title', async function() {
        assert(result.title === '豚の角煮');
    });

    it('has correct materialTitle', async function() {
        assert(result.materialTitle === '材料：4人分');
    });

    it('has correct recipeNumber', async function() {
        assert(result.recipeNumber === '自動68');
    });

    it('has correct time', async function() {
        assert(result.time === '90分');
    });

    it('has correct calorie', async function() {
        assert(result.calorie === '約860kcal');
    })

    it('has correct note', async function() {
        assert(result.note === '＊2～6人分まで自動でできます。 2～6人分でも、豚肉以外の材料は4人分と同じ量にします。 ＊肉の油抜きの調理時間は含んでいません。');
    });

    it('has 3 material groups', async function() {
        assert(result.materials.length === 3);
    });

    it('has correct contents for the first group', async function() {
        const grp = result.materials[0];
        assert(grp.title === undefined);
        assert(grp.materials.length === 1);
        assert(grp.materials[0].name === '豚バラ肉（かたまり）');
        assert(grp.materials[0].amount === '800g');
    });

    it('has correct contents for the last group', async function() {
        const grp = result.materials[2];
        assert(grp.title === 'B');
        assert(grp.materials.length === 6);

        // check first and last
        assert(grp.materials[0].name === '酒');
        assert(grp.materials[0].amount === '100mL');

        assert(grp.materials[5].name === '水');
        assert(grp.materials[5].amount === '400mL');
    });

    it('has two process', async function() {
        assert(result.process.length === 2);
    });

    it('has correct first process', async function() {
        assert(result.process[0] === '内鍋に5cm角に切った豚バラ肉と[A]を入れ、本体にセットする。\n手動で作る → スープを作る(まぜない） → 約30分 → 調理を開始する → スタート\n加熱後、肉を洗いアクを取る。');
    });

    it('has correct second process', async function() {
        assert(result.process[1] === '1の内鍋を軽く洗い、油抜きした肉と[B]を入れ、本体にセットする。\nメニューを選ぶ → メニュー番号で探す → No.068（豚の角煮） → 調理を開始する → スタート\n※煮汁は煮つめてかけてもよいでしょう。');
    });

    it('has correct image url', async function() {
        assert(result.imageUrl === 'https://cook-healsio.jp/hotcook/images/800x600/R4068.jpg');
    });
});

describe('parseRecipe test (no calorie input)', () => {
    let testInput: string;
    let result: Recipe;

    before(function() {
        testInput = fs.readFileSync(path.join(__dirname, 'data/recipe_nocalorie.html'), 'utf-8');
    });

    it('can parser the test input', async function() {
        const parser = new Parser('https://cook-healsio.jp/hotcook/HW24C/recipes');
        result = parser.parseRecipe(testInput);
    });

    it('does not have calorie', async function() {
        assert(result.calorie === null);
    })
});