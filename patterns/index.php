<?php

$HTML = '';

$demos = [
    ['messages', 'Start here.  Simple messages between two entities playing ping-pong.'],
];


$HTML .= PHP_EOL . '<!DOCTYPE html>';
$HTML .= PHP_EOL . '<html lang="en">';
$HTML .= PHP_EOL . '<link rel="icon" href="data:;base64,iVBORw0KGgo=">';

$HTML .= PHP_EOL . '<head>';
$HTML .= PHP_EOL . '    <meta charset="utf-8" />';
$HTML .= PHP_EOL . '    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">';

$HTML .= PHP_EOL . '    <script type="text/javascript" charset="UTF-8"';
$HTML .= PHP_EOL . '        src="../lib/jsxgraphcore.js"></script>';
$HTML .= PHP_EOL . '    <link rel="stylesheet" type="text/css" href="../lib/jsxgraph.css" />';

$HTML .= PHP_EOL . '    <!-- use modules instead of bundling-->';
$HTML .= PHP_EOL . '    <script type="module"  src="../lib/tsxgraph.js"></script>';

if (!empty($_SERVER['QUERY_STRING'])) {
    $HTML .= PHP_EOL . "    <script type='module'  src='{$_SERVER['QUERY_STRING']}.js'></script>";
}

$HTML .= PHP_EOL . '</head>';

$HTML .= PHP_EOL . '<body>';

foreach ($demos as $demo) {
    $HTML .= "<table>";
    $HTML .= "<tr><td><a href='./?{$demo[0]}'><button type='button'>messages</button></a></td><td>{$demo[1]}</td></tr>";
    $HTML .= "</table>";
}

$HTML .= PHP_EOL . '<div id="jsxbox" class="jsxbox" style="width:1000px; height:1000px;background-color:straw;">';

$HTML .= PHP_EOL . '</div>';

$HTML .= PHP_EOL . '</body>';
$HTML .= PHP_EOL . '</html>';

echo $HTML;
echo $_SERVER['QUERY_STRING'];
