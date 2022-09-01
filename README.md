# SQL Create Table Statement Analyzer
[![GitHub](https://img.shields.io/github/license/tinywisp/sql-create-table-statement-analyzer)](https://github.com/TinyWisp/sql-create-table-statement-analyzer/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/sql-create-table-statement-analyzer)](https://www.npmjs.com/package/sql-create-table-statement-analyzer)

extract column detail from SQL create table statements

- [Getting Started](#getting-started)
- [Demo](https://tinywisp.github.io/sql-create-table-statement-analyzer/)
- [Dependencies](#dependencies)

从SQL建表语句中提取出字段信息

- [开始使用](#开始使用)
- [示例](https://tinywisp.github.io/sql-create-table-statement-analyzer/)
- [依赖](#依赖)

## Getting Started
npm
```
npm install sql-create-table-statement-analyzer --save
```

import
```
import { getTables } from 'sql-create-table-statement-analyzer'
```

Basic Usage
```javascript
import { getTables } from 'sql-create-table-statement-analyzer'

const sql = "\
CREATE TABLE `article` (\
  `id` int NOT NULL AUTO_INCREMENT,\
  `space_id` int NOT NULL,\
  `node_id` int NOT NULL COMMENT '节点id',\
  `type` int NOT NULL COMMENT '文章类型: 1.富文本 2.markdown 3.附件',\
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标题',\
  `body` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',\
  `search` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '搜索',\
  `level` int unsigned NOT NULL DEFAULT '0' COMMENT '级别',\
  `ext` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '扩展字段',\
  `author` int NOT NULL COMMENT '作者uid',\
  `version` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '版本号',\
  `pos` int NOT NULL COMMENT '排序',\
  `ctime` timestamp NOT NULL DEFAULT '1970-01-01 00:00:01' COMMENT '创建时间',\
  `stime` timestamp NOT NULL COMMENT '保存时间',\
  `mtime` timestamp NOT NULL DEFAULT '1970-01-01 00:00:01' COMMENT '最后写入时间',\
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除状态: 0未删除 1已删除',\
  PRIMARY KEY (`id`),\
  KEY `space_id_tree_id_node_id` (`space_id`,`node_id`)\
) ENGINE=InnoDB AUTO_INCREMENT=230 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\
"

tables = getTables(sql)
console.log(tables)
```

## Dependencies
- [mysql-tokenizer](https://github.com/mashthekeys/mysql-tokenizer)

## 开始使用
npm
```
npm install sql-create-table-statement-analyzer --save
```

引入
```
import { getTables } from 'sql-create-table-statement-analyzer'
```

基本用法
```javascript
import { getTables } from 'sql-create-table-statement-analyzer'

const sql = "\
CREATE TABLE `article` (\
  `id` int NOT NULL AUTO_INCREMENT,\
  `space_id` int NOT NULL,\
  `node_id` int NOT NULL COMMENT '节点id',\
  `type` int NOT NULL COMMENT '文章类型: 1.富文本 2.markdown 3.附件',\
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标题',\
  `body` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',\
  `search` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '搜索',\
  `level` int unsigned NOT NULL DEFAULT '0' COMMENT '级别',\
  `ext` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '扩展字段',\
  `author` int NOT NULL COMMENT '作者uid',\
  `version` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '版本号',\
  `pos` int NOT NULL COMMENT '排序',\
  `ctime` timestamp NOT NULL DEFAULT '1970-01-01 00:00:01' COMMENT '创建时间',\
  `stime` timestamp NOT NULL COMMENT '保存时间',\
  `mtime` timestamp NOT NULL DEFAULT '1970-01-01 00:00:01' COMMENT '最后写入时间',\
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除状态: 0未删除 1已删除',\
  PRIMARY KEY (`id`),\
  KEY `space_id_tree_id_node_id` (`space_id`,`node_id`)\
) ENGINE=InnoDB AUTO_INCREMENT=230 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\
"

tables = getTables(sql)
console.log(tables)
```

## 依赖
- [mysql-tokenizer](https://github.com/mashthekeys/mysql-tokenizer)
