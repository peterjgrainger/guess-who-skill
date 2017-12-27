class Character {
  
  constructor(desc) {
    Object.assign(this, desc);
  }
  
  toString() {
    return `${this.name} is wearing a ${this.wear}, they are ${this.gender}, have a ${this.feature}, hair is ${this.hair} and they work as a ${this.job}`
  }
}

module.exports = Character;