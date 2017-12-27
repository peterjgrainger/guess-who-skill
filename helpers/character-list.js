const Chance = require('chance');
const Character = require('../models/character')
const chance = new Chance();
const characters = {}
const numberOfCharacters = 24;

const toWear = ['beret', 'bowler', 'fez', 'flat cap', 'glasses']
const jobs = ['programmer', 'cook', 'fireman', 'police officer'];
const features = ['big nose', 'rosy cheeks', 'freckles', 'birth mark'];
const hairColour = ['black', 'brown', 'blonde', 'white', 'grey']

for(let index = 0; index <= numberOfCharacters; index++) {
  
  const gender = chance.gender().toLowerCase();
  const name = chance.first({
    gender: gender
  }).toLowerCase();
  characters[name] = new Character({
    gender: gender,
    name: name,
    wear: chance.pick(toWear),
    job: chance.pick(jobs),
    feature: chance.pick(features),
    hair: chance.pick(hairColour)
  })
}

module.exports = characters;
