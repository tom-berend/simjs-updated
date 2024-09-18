<?php

$HTML = '';

$demos = [
    // filename   demonstrates
    ['pingpong', 'sendMessage()', 'Messages between two entities playing ping-pong.  <b>Start Here</b>'],
    ['traffic', 'waitEvent()', 'Events at a traffic intersection. '],

    ['queuetest', 'Queue()', 'Tests the queue. '],

    // case 'useFacility':        //   use a facility
    // case 'putBuffer':          //   put fungible tokens in a buffer
    // case 'getBuffer':          //   get tokens from buffer
    // case 'putStore':           //   store distinct objects in a store
    // case 'getStore':           //   retrieve object from a store
    // case 'queueEvent':         //   queue on an event


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

$HTML .= "<table>";
foreach ($demos as $demo) {
    $HTML .= "<tr>
        <td><a href='./?{$demo[0]}'><button type='button'>{$demo[0]}</button></a></td>
        <td><b>{$demo[1]}</b></td>
        <td>{$demo[2]}</td>
    </tr>";
}
$HTML .= "</table>";

$HTML .= PHP_EOL . '<div id="jsxbox" class="jsxbox" style="width:1000px; height:1000px;background-color:straw;">';

$HTML .= PHP_EOL . '</div>';

$HTML .= PHP_EOL . '</body>';
$HTML .= PHP_EOL . '</html>';

echo $HTML;
