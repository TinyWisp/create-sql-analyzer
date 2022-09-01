import tokenizerFactory from 'mysql-tokenizer'

const MATCH = {
  STRING: 1
}

class InvalidSqlCreateTableStatementError extends Error {
  constructor () {
    super('Invalid sql create statement')
  }
}

function isString (token) {
  return ['"', '`', "'"].includes(token[0])
}

function isComment (token) {
  return token[0] === '#' || ['--', '/*'].includes(token.substr(0, 2))
}

function isWhitespace (token) {
  return /^\s+$/.test(token)
}

function getStringValue (token) {
  return token.substring(1, token.length - 1).replaceAll(`${token[0]}${token[0]}`, token[0])
}

function trim (tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return tokens
  }

  let start = 0
  let end = tokens.length - 1

  if (tokens[0] === ' ') {
    start = 1
  }

  if (tokens[tokens.length - 1] === ' ') {
    end = tokens.length - 2
  }

  return tokens.slice(start, end + 1)
}

function match (tokens, pattern) {
  if (tokens.length < pattern.length) {
    return false
  }

  for (let i = 0; i < pattern.length; i++) {
    if ((typeof pattern[i] === 'string' && tokens[i] !== pattern[i]) ||
      (typeof pattern[i] === 'number' && pattern[i] === MATCH.STRING && !isString(tokens[i])) ||
      (typeof pattern[i] === 'object' && pattern[i] instanceof RegExp && !pattern[i].test(tokens[i]))) {
      return false
    }
  }

  return true
}

function isCreateStatement (statement) {
  return match(statement, ['CREATE', ' ', 'TABLE', ' '])
}

function tokenizeSql (sql) {
  const tokenize = tokenizerFactory()
  const tokens = tokenize(sql)

  if (!Array.isArray(tokens) || tokens.length < 10) {
    return []
  }

  tokens.forEach((token, i) => {
    if (isString(token)) {
      return
    }
    if (isComment(token) || isWhitespace(token)) {
      tokens[i] = ' '
      return
    }
    tokens[i] = token.toUpperCase()
  })

  const tokenCount = tokens.length
  return tokens.filter((token, i) => {
    return !(token === ' ' && i <= tokenCount - 2 && tokens[i + 1] === ' ')
  })
}

function split (tokens, delimiter) {
  const chunks = []

  let chunk = []
  tokens.forEach((token) => {
    if (token === delimiter) {
      chunks.push(trim(chunk))
      chunk = []
    } else {
      chunk.push(token)
    }
  })

  if (trim(chunk).length > 0) {
    chunks.push(trim(chunk))
  }

  return chunks
}

function getMatchedRightRoundBracketPos (tokens, leftRoundBracketPos) {
  let counter = 0

  for (let i = leftRoundBracketPos; i < tokens.length; i++) {
    if (tokens[i] === '(') {
      counter++
    }

    if (tokens[i] === ')') {
      counter--
    }

    if (counter === 0) {
      return i
    }
  }

  throw new InvalidSqlCreateTableStatementError()
}

function splitCreateBody (body) {
  const chunks = []

  let chunk = []
  let counter = 0
  body.forEach((token) => {
    if (token === '(') {
      counter++
    }
    if (token === ')') {
      counter--
    }

    if (token === ',' && counter === 0) {
      chunks.push(trim(chunk))
      chunk = []
    } else {
      chunk.push(token)
    }
  })

  if (trim(chunk).length > 0) {
    chunks.push(trim(chunk))
  }

  return chunks
}

/**
 * extract columns from the body of a sql create table statement
 * @param {*} body
 * @returns
 */
function getColumnsFromCreateBody (body) {
  const columns = []

  const fragments = splitCreateBody(body)
  fragments.forEach((stm) => {
    try {
      if (!isString(stm[0])) {
        return
      }

      if (stm.length < 2) {
        throw new InvalidSqlCreateTableStatementError()
      }

      // column name
      const columnName = getStringValue(stm[0])

      // data type
      let columnDataType = ''
      if (stm[2] !== ' ') {
        for (let i = 2; i < stm.length; i++) {
          if (stm[i] !== ' ') {
            columnDataType = `${columnDataType}${stm[i]}`
          } else {
            if (stm[i] === ' ' && stm[i + 1] === 'UNSIGNED') {
              columnDataType = `${columnDataType} UNSIGNED`
            }
            break
          }
        }
      }

      // default value
      let columnDefaultValue = ''
      for (let i = 0; i < stm.length; i++) {
        if (stm[i] !== 'DEFAULT') {
          continue
        }

        const leftTokens = stm.slice(i, stm.length)
        if (match(leftTokens, ['DEFAULT', ' ', MATCH.STRING])) {
          columnDefaultValue = getStringValue(leftTokens[2])
          break
        }

        if (match(leftTokens, ['DEFAULT', ' ', '('])) {
          const start = 2
          const end = getMatchedRightRoundBracketPos(leftTokens, start)
          leftTokens.slice(start + 1, end).forEach((token) => {
            columnDefaultValue = columnDefaultValue + token
          })
          break
        }

        if (match(leftTokens, ['DEFAULT', ' ', 'CURRENT_TIMESTAMP'])) {
          columnDefaultValue = 'CURRENT_TIMESTAMP'
          break
        }

        if (match(leftTokens, ['DEFAULT', ' ', 'NULL'])) {
          columnDefaultValue = 'NULL'
          break
        }

        break
      }

      // comment
      let columnComment = ''
      for (let i = 0; i < stm.length; i++) {
        if (stm[i] !== 'COMMENT') {
          continue
        }

        const leftTokens = stm.slice(i, stm.length)
        if (match(leftTokens, ['COMMENT', ' ', MATCH.STRING])) {
          columnComment = getStringValue(leftTokens[2])
        }
        break
      }

      // not null
      let notNull = false
      for (let i = 0; i < stm.length; i++) {
        const leftTokens = stm.slice(i, stm.length)
        if (match(leftTokens, ['NOT', ' ', 'NULL'])) {
          notNull = true
          break
        }
      }

      // auto increment
      let autoIncrement = false
      for (let i = 0; i < stm.length; i++) {
        if (stm[i] === 'AUTO_INCREMENT') {
          autoIncrement = true
          break
        }
      }

      // character
      let character = ''
      for (let i = 0; i < stm.length; i++) {
        const leftTokens = stm.slice(i, stm.length)
        if (match(leftTokens, ['CHARACTER', ' ', 'SET', ' ']) && leftTokens.length >= 5) {
          character = leftTokens[4]
          break
        }
      }

      // collate
      let collate = ''
      for (let i = 0; i < stm.length; i++) {
        const leftTokens = stm.slice(i, stm.length)
        if (match(leftTokens, ['COLLATE', ' ']) && leftTokens.length >= 3) {
          collate = leftTokens[2]
          break
        }
      }

      columns.push({
        name: columnName,
        dataType: columnDataType,
        defaultValue: columnDefaultValue,
        comment: columnComment,
        notNull,
        autoIncrement,
        character,
        collate
      })
    } catch (e) {
      console.log(e)
    }
  })

  return columns
}

/**
 * analyze a sql create table statement and get its detail
 * @param {*} statement
 * @returns
 */
function getCreateDetail (statement) {
  if (!isCreateStatement(statement)) {
    return null
  }

  let leftRoundBracketPos = 0
  let rightRoundBracketPos = 0
  statement.find((token, i) => {
    if (token === '(') {
      leftRoundBracketPos = i
      rightRoundBracketPos = getMatchedRightRoundBracketPos(statement, leftRoundBracketPos)
      return true
    }

    return false
  })

  const before = trim(statement.slice(0, leftRoundBracketPos))
  const after = trim(statement.slice(rightRoundBracketPos + 1, statement.length))
  const body = trim(statement.slice(leftRoundBracketPos + 1, rightRoundBracketPos))

  // table name
  let tableName = ''
  if (match(before, ['CREATE', ' ', 'TABLE', ' ', MATCH.STRING, '.', MATCH.STRING])) {
    tableName = getStringValue(before[4]) + '.' + getStringValue(before[6])
  } if (match(before, ['CREATE', ' ', 'TABLE', ' ', MATCH.STRING])) {
    tableName = getStringValue(before[4])
  } else if (match(before, ['CREATE', ' ', 'TABLE', ' ', 'IF', ' ', 'NOT', ' ', 'EXIST', ' ', MATCH.STRING, '.', MATCH.STRING])) {
    tableName = getStringValue(before[10] + '.' + getStringValue(before[12]))
  } else if (match(before, ['CREATE', ' ', 'TABLE', ' ', 'IF', ' ', 'NOT', ' ', 'EXIST', ' ', MATCH.STRING])) {
    tableName = getStringValue(before[10])
  } else {
    throw new InvalidSqlCreateTableStatementError()
  }

  // table comment
  let tableComment = ''
  for (let i = after.length - 3; i >= 0; i--) {
    if (after[i] !== 'COMMENT') {
      continue
    }

    const tokens = after.slice(i, after.length)
    if (match(tokens, ['COMMENT', '=', MATCH.STRING])) {
      tableComment = getStringValue(tokens[2])
    } else if (match(tokens, ['COMMENT', ' ', '=', MATCH.STRING])) {
      tableComment = getStringValue(tokens[3])
    } else if (match(tokens, ['COMMENT', ' ', '=', ' ', MATCH.STRING])) {
      tableComment = getStringValue(tokens[4])
    } else {
      throw new InvalidSqlCreateTableStatementError()
    }

    break
  }

  // columns
  const columns = getColumnsFromCreateBody(body)

  return {
    name: tableName,
    comment: tableComment,
    columns
  }
}

/**
 * analyze a sql and extract table details from its create table statements
 * @param {*} sql
 * @returns
 */
function getTables (sql) {
  const tokens = tokenizeSql(sql)
  const stms = split(tokens, ';')

  const tables = []
  for (const stm of stms) {
    if (!isCreateStatement(stm)) {
      continue
    }

    try {
      const table = getCreateDetail(stm)
      if (table) {
        tables.push(table)
      }
    } catch (e) {
      console.log(e)
    }
  }

  return tables
}

export { getTables }
